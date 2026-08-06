export class TimeslotModel{
    constructor(){
        this.id = 0;
        this.start_time = '';
        this.end_time = '';
        this.status = 0;
        this.created_at = "";
        this.updated_at = '';
        this.date = "";
    }

    setTimeSlot(slot){
        this.id = slot.id;
        this.start_time = slot.start_time;
        this.end_time = slot.end_time;
        this.status = slot.status;
        this.created_at = slot.created_at;
        this.updated_at = slot.updated_at;
        this.date = '';
    }
}