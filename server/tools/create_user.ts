import * as models from '../models';
let user = new models.User({email:"Dima",password:"123"});
user.save();