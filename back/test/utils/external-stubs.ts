import * as nock from 'nock';

export function stubGooglePlacesOk(): nock.Scope {
  const scope = nock('https://places.googleapis.com')
    .post('/v1/places:searchText')
    .reply(200, {
      places: [
        {
          id: 'goog-test-1',
          displayName: { text: 'Stub Cafe' },
          formattedAddress: '1 Stub St',
          websiteUri: 'https://stub.example.com',
          internationalPhoneNumber: '+33123456789',
          rating: 4.5,
          userRatingCount: 100,
          types: ['cafe', 'food'],
          businessStatus: 'OPERATIONAL',
        },
      ],
    });
  return scope;
}

export function stubGooglePlaces5xx(): nock.Scope {
  return nock('https://places.googleapis.com')
    .post('/v1/places:searchText')
    .reply(500, { error: 'boom' });
}

export function stubMapboxOk(): nock.Scope {
  return nock('https://api.mapbox.com')
    .get(/\/search\/geocode\/v6\/reverse.*/)
    .reply(200, { features: [] });
}

export function stubOsmNominatimEmpty(): nock.Scope {
  return nock('https://nominatim.openstreetmap.org')
    .get(/\/reverse.*/)
    .reply(200, {});
}

export function disableNetConnect(): void {
  nock.disableNetConnect();
  // Allow loopback so supertest can talk to the in-process server.
  nock.enableNetConnect((host) => /^(127\.0\.0\.1|localhost)/.test(host));
}

export function cleanAllStubs(): void {
  nock.cleanAll();
}
