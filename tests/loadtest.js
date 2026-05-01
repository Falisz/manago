import http from 'k6/http';
import { check, sleep } from 'k6';

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

const BASE_URL = 'http://localhost:3000';

export function setup() {
    const payload = JSON.stringify({
        username: 'ceo',
        password: '@$^P4sSw0rD!#%'
    });
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const loginRes = http.post(`${BASE_URL}/auth`, payload, params);

    let sessionId = '';
    if (loginRes.cookies['session_id'] && loginRes.cookies['session_id'].length > 0) {
        sessionId = loginRes.cookies['session_id'][0].value;
        console.log('Logowanie pomyślne - ciasteczko session_id otrzymane!');
    } else {
        console.error('Błąd logowania - nie otrzymano ciasteczka session_id!');
    }

    return { sessionId: sessionId };
}

export default function (data) {
    const jar = http.cookieJar();
    jar.set(BASE_URL, 'session_id', data.sessionId);

    const url = `${BASE_URL}/shifts?start_date=2026-05-01&end_date=2026-05-07&user_scope=team&user_scope_id=1&schedule=null`;

    const params = {
        headers: {
            'Accept': 'application/json, text/plain, */*',
        },
    };

    const res = http.get(url, params);

    check(res, {
        'status is 200 OK': (r) => r.status === 200,
        'is JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    });

    sleep(1);
}