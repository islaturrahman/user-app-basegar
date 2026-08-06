export default class CategoryModel {
  constructor(json = {}) {
    this.id = json.id || 0;
    this.name = json.name || "";
    this.image = json.image || "";
    this.banner = json.banner || "";
    this.parent_id = json.parent_id || 0;
    this.position = json.position || 0;
    this.priority = json.priority || "1";
    this.status = json.status || 1;
    this.translations = json.translations || [];
    this.created_at = json.created_at || "";
    this.updated_at = json.updated_at || "";
  }

  isActive() {
    return this.status === 1;
  }
}
