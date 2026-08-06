class AddressModel {
  constructor() {
    this.address = []
    this.lastAddress = null;
  }

  setAddress(address) {
    this.address = address;
  }

  setLastAddress(lastAddress) {
    this.lastAddress = lastAddress;
  }

  getLastAddress() {
    return this.lastAddress;
  }

  getAddress() {
    return this.address;
  }

}

export class PlacesDetails{
  constructor(){
    this.langitude = '';
    this.latitude = '';
    this.name = '';
    this.url = '';
    this.address = '';
  }

  setPlaceDetails(address){
    this.langitude = address.geometry.location.lng;
    this.latitude = address.geometry.location.lat;
    this.name = address.name;
    this.url = address.url;
  }
}


export default AddressModel;