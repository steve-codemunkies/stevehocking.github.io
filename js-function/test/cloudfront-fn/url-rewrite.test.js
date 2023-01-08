const origin = require('../../cloudfront-fn/url-rewrite');
const handler = origin.__get__('handler');

function buildEvent(uri) {
    return {
        request: {
            uri: uri
        }
    };
}

describe('Test the CloudFront Function handler', () => {

    test('when the uri ends in / then index.html should be appended', () => {
        const event = buildEvent('/test/');
        const returnedRequest = handler(event);

        expect(returnedRequest).toBe(event.request);
        expect(returnedRequest.uri).toBe('/test/index.html');
    });

    test('when the uri does not contain . then  /index.html should be appended', () => {
        const event = buildEvent('/test');
        const returnedRequest = handler(event);

        expect(returnedRequest).toBe(event.request);
        expect(returnedRequest.uri).toBe('/test/index.html');
    });

    test('when the uri has a file extension it should be unaltered', () => {
        const event = buildEvent('/test/file.png');
        const returnedRequest = handler(event);

        expect(returnedRequest).toBe(event.request);
        expect(returnedRequest.uri).toBe('/test/file.png');
    });

});