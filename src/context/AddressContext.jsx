import React, { createContext, useState, useContext } from 'react';
import { last_ordered_address } from '../config/enpoints';

const AddressContext = React.createContext({
    addresses: [],
    lastAddress : null,
    getAddress: () => {},
    getLastAddress: () => {},
    setSelectedAddress: () => {},
    getSelectedAddress: () => {},
    addAddress: () => {},
    removeAddress: () => {},
    updateAddress: () => {},
});

export default AddressContext;