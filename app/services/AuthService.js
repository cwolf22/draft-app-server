import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import config from '../config'

export default class AuthService {
    static instance;
    
    constructor(dbConnector) {
        if (AuthService.instance) return AuthService.instance;

        this.dbConnector = dbConnector;
        AuthService.instance = this;
    }

    async register(user, password) {
        console.log(`[AuthService :: ${user}] - Login`)
        const hash = bcrypt.hashSync(password, 10);
        await this.dbConnector.createUser(user, hash);
        return hash;  
    }

    async login(user, password) {
        console.log(`[AuthService :: ${user}] - Login`)
        const document = await this.dbConnector.getUser(user);
        const hash = document.get('hash');
        if (hash && bcrypt.compareSync(password, hash)) return hash;

        throw {status: 401, message: 'Username or password is incorrect'};
    }

    generateToken(email, hash) {
        console.log(`[AuthService :: ${user}] - Generate JWT`)
        return jwt.sign({ email, hash }, config.secrets.JWT, { expiresIn: '24h' });
    }
}