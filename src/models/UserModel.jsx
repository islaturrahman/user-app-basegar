class UserModel{
    constructor(){
        this.users = [];
        this.token = '';
    }

    getUser(){
        return this.users;
    }

    setUser(user){
        return this.users = user;
    }


    getToken(){
        return this.token;
    }

    setToken(token){
        return this.token = token;
    }
} 

export default UserModel;