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
        console.log(`[AuthService :: ${user}] - Login`);
        const document = await this.dbConnector.getUser(user);
        const hash = document.get('hash');
        if (hash && bcrypt.compareSync(password, hash)) return hash;

        throw {status: 401, message: 'Username or password is incorrect'};
    }

    //TODO: come up with proper token expiration and refresh strategy
    generateToken(user, hash) {
        console.log(`[AuthService :: ${user}] - Generate JWT`);
        return jwt.sign({ user, hash }, config.secrets.JWT, { expiresIn: '356d' });
    }
}