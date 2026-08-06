import { banners } from '../config/enpoints.js';
import { StateManager } from './stateManager.js';

const initialProductsState = {
    products: [],
    banners: []
};

export const productsStateManager = new StateManager(initialProductsState);