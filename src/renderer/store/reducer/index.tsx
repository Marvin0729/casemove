import { combineReducers } from "redux";
import inventoryReducer from "./inventory";
import authReducer from "./userStatus";
import inventoryFiltersReducer from './inventoryFiltersRed'
import modalMoveReducer from './modalMove'
import modalRenameReducer from './modalRename'
import moveFromReducer from './moveFromReducers'
import moveToReducer from './moveToReducers'

const rootReducers = combineReducers({
    authReducer,
    inventoryReducer,
    inventoryFiltersReducer,
    modalMoveReducer,
    modalRenameReducer,
    moveFromReducer,
    moveToReducer
})

export default rootReducers;

export type RootState = ReturnType<typeof rootReducers>