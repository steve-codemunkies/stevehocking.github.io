---
layout: 	post
title:  	"How to destroy the performance of an SQL query, and then bring it back"
description:  "But it's only a FLAG!!!"
date:   	2016-09-09 15:00:00
categories: sql-server query performance
comments: true
page-type: article
hero-image: /assets/2016-09-09-speed.jpg
---
This is the story of an ugly query that worked, that was spectacularly broken, and then put back together in a completely different way. Oh and imagination, mis-applied imagination and lack of imagination.

The initial query is somewhat ugly, but works:

<pre>SELECT Id
  ,Name
  ,Email
  ,LastExportDateTime
  ,ReportFormat
  ,TransportMethod
FROM [dbo].[Suppliers] s
  LEFT JOIN (SELECT SupplierId
      ,MAX(ExportDateTime) AS LastExportDateTime
    FROM [scheduler].[SupplierExportHistory]
    GROUP BY SupplierId) History ON Id=SupplierId
WHERE Status='L'
  AND Id IN (SELECT Id
    FROM [dbo].[Suppliers] s
      INNER JOIN [dbo].[Bookings] b ON s.Id=b.SupplierId
      LEFT JOIN [scheduler].[SupplierExportHistory] seh ON s.Id=seh.SupplierId
      LEFT JOIN [dbo].[Communications] c ON c.BookingReference=b.BookingReference AND (CommunicationType='A' OR CommunicationType='C')
    GROUP BY s.sup_id
    HAVING MAX(BookingDate)>MAX(ExportDateTime)
    OR MAX(c.DateSent)>MAX(ExportDateTime))</pre>

This query is used to drive a process that ultimately results in transaction details being distributed to suppliers, so that they can be actioned. The query works fine and is sub-second. Which in retrospect is somewhat surprising, given that the way it determines if a supplier has outstanding transactions is definitely sub-optimal.

The problems started when we had a request from one of the suppliers to always receive a report, regardless of whether they had transactions to action. Actually this isn't a hard request to accommodate, it just needs a flag adding to the supplier table, and then those suppliers with the flag set always including in the query result. And so having used our _imagination quotient_ we then end up with this query:

<pre>SELECT Id
  ,Name
  ,Email
  ,LastExportDateTime
  ,ReportFormat
  ,TransportMethod
FROM [dbo].[Suppliers] s
  LEFT JOIN (SELECT SupplierId
      ,MAX(ExportDateTime) AS LastExportDateTime
    FROM [scheduler].[SupplierExportHistory]
    GROUP BY SupplierId) History ON Id=SupplierId
WHERE Status='L'
  AND (Id IN (SELECT Id
    FROM [dbo].[Suppliers] s
      INNER JOIN [dbo].[Bookings] b ON s.Id=b.SupplierId
      LEFT JOIN [scheduler].[SupplierExportHistory] seh ON s.Id=seh.SupplierId
      LEFT JOIN [dbo].[Communications] c ON c.BookingReference=b.BookingReference AND (CommunicationType='A' OR CommunicationType='C')
    GROUP BY s.sup_id
    HAVING MAX(BookingDate)>MAX(ExportDateTime)
    OR MAX(c.DateSent)>MAX(ExportDateTime))
  OR GenerateEmptyExport=1)</pre>

Which is very similar to where we started. But which SQL Server views in a _very_ different light. My understanding of SQL Server execution plans isn't the best, but the first query has a merge join early on, which allows quite a lot of the query to be paralellized. The second query though has lots of hash matches and nested loops, and is a much more linear query. And this is why it takes 40+ seconds to execute.

Which meant that I needed to re-engage imagination, and think of a better way of doing the query. The key thing I was trying to achieve with the query was to provide SQL Server with more opportunity to parallelize. The breakthrough (for me) came in realising that I could get the latest dates for bookings and communications through `INNER JOIN`s and then apply my criteria in a much simplified `WHERE` clause.

<pre>SELECT Id
  ,Name
  ,Email
  ,LastExportDateTime
  ,ReportFormat
  ,TransportMethod
FROM [dbo].[Suppliers] s
  LEFT JOIN (SELECT SupplierId
      ,MAX(ExportDateTime) AS LastExportDateTime
    FROM [scheduler].[SupplierExportHistory]
    GROUP BY SupplierId) History ON sup_id=History.SupplierId
  LEFT JOIN (SELECT SupplierId
      ,MAX(BookingDate) LatestBookingDate
    FROM [dbo].[Bookings]
    GROUP BY SupplierId) LatestTransactions ON s.Id=LatestTransactions.SupplierId
  LEFT JOIN (SELECT SupplierId
      ,MAX(DateSent) LatestCommDate
    FROM [dbo].[Communications]
    GROUP BY SupplierId) LatestComms ON s.Id=LatestComms.SupplierId
WHERE LatestTransactions.LatestBookingDate>History.LastExportDateTime
  OR LatestComms.LatestCommDate>History.LastExportDateTime
  OR s.GenerateEmptyExport=1</pre>

And rather nicely this query seems to manage that. Looking at the execution plan the most expensive part of the query is getting the latest booking date for each supplier, taking around sixty percent of the execution time. Even this looks to be improvable by adding an index that includes these two fields.

And the take aways from this little tale? If something looks ugly there's a fair chance it will perform ugly at some point. And SQL Server execution plans are not meant for mortals to understand.
