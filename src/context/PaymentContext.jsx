import { Children, createContext, useState } from "react";

const PaymentContext = createContext({
   selectedPayment: '',
});

export default PaymentContext;


