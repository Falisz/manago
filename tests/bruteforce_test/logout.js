import http from 'k6/http';
import { check } from 'k6';

export const options = {
    vus: 1,
    iterations: 1,
};

const BASE_URL = 'http://172.23.154.187:5000';

export default function () {
    const loginPayload = JSON.stringify({
        username: 'ceo',
        password: '@$^P4sSw0rD!#%',
    });

    const loginRes = http.post(`${BASE_URL}/auth`, loginPayload, {
        headers: { 'Content-Type': 'application/json' },
    });
    console.log(`Status odpowiedzi w Kroku 1: ${loginRes.status}`);

    const loginOk = check(loginRes, {
        'Krok 1: Logowanie zakończone sukcesem (200)': (r) => r.status === 200,
    });

    if (!loginOk) {
        console.error('Przerwanie testu: Nie udało się zalogować.');
        return;
    }

    const vuJar = http.cookieJar();
    const cookiesForUrl = vuJar.cookiesForURL(BASE_URL);
    const accessToken = cookiesForUrl.access_token ? cookiesForUrl.access_token[0] : null;
    const refreshToken = cookiesForUrl.refresh_token ? cookiesForUrl.refresh_token[0] : null;

    if (!accessToken) {
        console.error('Błąd: Nie znaleziono ciasteczka access_token w odpowiedzi serwera.');
        return;
    } else {
        console.log('Znaleziony accessToken:', accessToken)
    }

    // KROK 2: Wylogowanie (Deautoryzacja)
    const logoutRes = http.get(`${BASE_URL}/logout`);
    console.log(`Status odpowiedzi w Kroku 2: ${logoutRes.status}`);
    
    check(logoutRes, {
        'Krok 2: Wylogowanie zakończone sukcesem': (r) => r.status === 200 || r.status === 204,
    });

    // KROK 3: Próba użycia tego samego tokenu do zabezpieczonego endpointu
    const attackHeaders = {
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `access_token=${accessToken}`, // Wstrzykujemy stary token JWT
        },
    };

    const protectedRes = http.get(`${BASE_URL}/users/100007`, attackHeaders);
    console.log(`Status odpowiedzi w Kroku 3: ${protectedRes.status}`);

    check(protectedRes, {
        'Krok 3: Serwer poprawnie odrzucił stary token (401)': (r) => r.status === 401,
    });
}