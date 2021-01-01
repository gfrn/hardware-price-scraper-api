let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index.js');
let should = chai.should();

const stores = require('../config/regex.json');

chai.use(chaiHttp);

describe('/GET kabum', () => {
    it('should GET all results for a product search in Kabum', async () => {
        for(let store in stores) {
            let res = await chai.request(server)
            .get(`/get?store=${store}&query=monitor`)
            .send();
            res.should.have.status(200);
            res.body.should.be.a('array');
            res.body[0].should.have.property('price').which.is.a.Number;
            res.body[0].should.have.property('name').which.is.a.String;
            res.body[0].should.have.property('img').which.is.a.String;
            res.body[0].should.have.property('url').which.is.a.String;
        }
    });
});
