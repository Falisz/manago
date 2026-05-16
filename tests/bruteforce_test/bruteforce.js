import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Counter } from 'k6/metrics';

const status401Counter = new Counter('status_401_count');
const status429Counter = new Counter('status_429_count');
const statusOtherCounter = new Counter('status_other_count');

const passwords = open('./password.list').split(/\r?\n/).filter(line => line.trim() !== '');

export const options = {
    scenarios: {
        brute_force_attack: {
            executor: 'shared-iterations',
            vus: 5, 
            iterations: 200, 
            maxDuration: '10s', 
        },
    }
};

export default function () {
    const currentIteration = exec.scenario.iterationInTest;
    const password = passwords[currentIteration % passwords.length];

    const url = 'http://172.23.154.187:5000/auth';
    
    
    const payload = JSON.stringify({
        username: 'ceo',
        password: password
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(url, payload, params);

    if (res.status === 401) {
        status401Counter.add(1);
    } else if (res.status === 429) {
        status429Counter.add(1);
    } else {
        statusOtherCounter.add(1);
    }

    const isUnderLimit = currentIteration < 10;

    check(res, {
        'Przetworzone żądania (pierwsze 10 ze statusem 401, pozostałe 429) ': (r) => {
            return isUnderLimit ? r.status === 401 : r.status === 429;
        }
    });

    sleep(0.05); 
}