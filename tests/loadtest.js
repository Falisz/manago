import http from 'k6/http';
import { check, sleep } from 'k6';

const TEST_TYPE = __ENV.TEST || 'sessionStore'; // domyślnie sessionStore
const PASSWORD = __ENV.PASSWORD || '@$^P4sSw0rD!#%';
const USERNAME = __ENV.USERNAME || 'ceo';
const BASE_URL = 'http://localhost:3000';

export const options = {
    stages: [
        { duration: '15s', target: 20 },
        { duration: '30s', target: 20 },
        { duration: '15s', target: 0 },
    ],

    thresholds: {
        http_req_duration: ['p(95)<500'],
    },
};

export function setup() {
    const payload = JSON.stringify({
        username: USERNAME,
        password: PASSWORD
    });
    const params = { headers: { 'Content-Type': 'application/json' } };
    const loginRes = http.post(`${BASE_URL}/auth`, payload, params);

    let authData = { type: TEST_TYPE };

    if (TEST_TYPE === 'jwt') {
        console.log('Ustawianie testu pod JWT');

        if (loginRes.cookies['access_token'] && loginRes.cookies['refresh_token']) {
            authData.accessToken = loginRes.cookies['access_token'][0].value;
            authData.refreshToken = loginRes.cookies['refresh_token'][0].value;
            console.log('Logowanie pomyślne - ciasteczka JWT otrzymane!');
        } else {
            console.error('Błąd logowania - nie otrzymano ciasteczek JWT!');
        }

    } else {
        console.log('Ustawianie testu pod bazodanowego Session Store\'a');

        if (loginRes.cookies['session_id']) {
            authData.sessionId = loginRes.cookies['session_id'][0].value;
            console.log('Logowanie pomyślne - ciasteczko z session_id otrzymane!');
        } else {
            console.error('Błąd logowania - nie otrzymano ciasteczka z session_id!');
        }

    }
    return authData;
}

export default function (data) {
    if (data.error) return;

    const jar = http.cookieJar();
    if (data.type === 'jwt') {
        jar.set(BASE_URL, 'access_token', data.accessToken);
        jar.set(BASE_URL, 'refresh_token', data.refreshToken);
    } else {
        jar.set(BASE_URL, 'session_id', data.sessionId);
    }

    const url = `${BASE_URL}/shifts?start_date=2026-05-01&end_date=2026-05-07&user_scope=team&user_scope_id=1&schedule=null`;

    const params = { headers: { 'Accept': 'application/json, text/plain, */*' } };
    const res = http.get(url, params);

    check(res, {
        'status is 200 OK': (r) => r.status === 200,
        'is JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    });

    sleep(1);
}