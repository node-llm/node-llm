import { Role } from "./Role.js";

export interface Message {
  role: Role;
  content: string;
}
