import { customerInfo } from "../config/enpoints";
import { apiRequest, get } from "../data/api";
import UserModel from "../models/UserModel";

export class CustomerProvider {
  async getCustomer() {
    try {
      const user = await get(customerInfo);
      const userModel = new UserModel();
      userModel.setUser(user);
      return userModel;
    } catch (error) {
      console.error("Get customer error:", error.message);
      throw error;
    }
  }
}
