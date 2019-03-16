export default class CbsAPI {
    static instance;

    constructor() {
        if (CbsAPI.instance) return CbsAPI.instance;
        CbsAPI.instance = this;
    }
}