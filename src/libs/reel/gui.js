import _ from "../atomic_/core.js";
import $ from "../atomic_/shell.js";
import { reel } from "./shell.js";
import { reg } from "../cmd.js";
import supabase from "../supabase.js";
import { session } from "../session.js";

const params = new URLSearchParams(location.search);
const tableId = params.get('id');
const seat = _.maybe(params.get("seat"), parseInt);

export const $reel = reel(tableId, seat);

$.on($reel, "changed", function({details}){
  const {hist, changed} = details;
  const [curr, prior] = hist || [];
  const ctx = "gui";

  console.log({ctx, curr, prior, changed});
});
