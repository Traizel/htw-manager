
import { put, takeLatest } from 'redux-saga/effects';
import axios from 'axios'

function* captureOrders(action) {
  try {
    yield axios.post(`/api/capture`, action.payload);
  } catch (error) {
    console.log("Error with capturing orders:", error);
  }
}

function* getitemlist(action) {
  try {
    const response = yield axios.get(`/api/item/getitems`);
    yield put({
      type: "SET_ITEM",
      payload: response.data,
    });
  } catch (error) {
    console.log("Error with getting the list of items:", error);
  }
}

function* addItem(action) {
  try {
    yield axios.post(`/api/item/items`, action.payload);
    const response = yield axios.get(`/api/item/getitems`);
    yield put({
      type: "SET_ITEM",
      payload: response.data,
    });
  } catch (error) {
    console.log("Error with adding to the list of items:", error);
  }
}

function* deleteItem(action) {
  try {
    yield axios.delete(`/api/item/items:${action.payload.id}`);
    const response = yield axios.get(`/api/item/getitems`);
    yield put({
      type: "SET_ITEM",
      payload: response.data,
    });
  } catch (error) {
    console.log("Error with deleting from the list of items:", error);
  }
}

function* resetData(action) {
  try {
    yield axios.delete(`/api/item/all`);
    const response = yield axios.get(`/api/item/getitems`);
    yield put({
      type: "SET_ITEM",
      payload: response.data,
    });
  } catch (error) {
    console.log("Error with deleting from the list of items:", error);
  }
}

function* updatePrices(action) {
  try {
    yield axios.put(`/api/item/updatePrices`, action.payload);
  } catch (error) {
    console.log("Error with updating prices:", error);
  }
}

function* connectFtp(action) {
  try {
    const response = yield axios.put(`/api/item/ftp`, action.payload);
    yield put({
      type: "SET_SANMAR",
      payload: response.data,
    })
  } catch (error) {
    console.log("Error with connecting ftp:", error);
  }
}

function* sendEmail(action) {
  try {
    yield axios.put(`/api/item/email`, action.payload);
  } catch (error) {
    console.log("Error with sending email:", error);
  }
}


//this takes all of the Saga functions and dispatches them
function* itemSaga() {
    yield takeLatest('GET_ITEM_LIST', getitemlist);
    yield takeLatest('ADD_ITEM', addItem);
    yield takeLatest('DELETE_ITEM', deleteItem);
    yield takeLatest('CAPTURE_ORDERS', captureOrders);
    yield takeLatest('RESET_DATA', resetData);
    yield takeLatest('UPDATE_PRICES', updatePrices);
    yield takeLatest('CONNECT_FTP', connectFtp);
    yield takeLatest('SEND_EMAIL', sendEmail);
}

export default itemSaga;