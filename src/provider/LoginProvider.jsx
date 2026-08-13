import { isNumberOrEmail } from "../components/Helper";
import { login } from "../config/enpoints"
import { post } from "../data/api"


export class LoginProvider{

    async auth(phoneNumberOrEmail, password) {
        try {
            // Kirim permintaan login menggunakan fungsi post dari api.js
            const response = await post(login, {
                "email_or_phone": phoneNumberOrEmail,
                "password": password
            });

            // Cek apakah login berhasil
            if (response) {
                if(isNumberOrEmail(phoneNumberOrEmail) === 'phone'){
                    return response.temporary_token;
                }else{
                    return response.token;
                }
            } else {
                // Jika gagal, lempar error dengan pesan dari server
                throw new Error(response.errors[0].message);
            }
        } catch (error) {
            console.error('Login error:', error.message);
            throw error; // Lempar error ke komponen yang memanggil fungsi ini
        }
    }
}

