import supabase from "./supabase.js";
import _ from "./atomic_/core.js";
import $ from "./atomic_/shell.js";

export function online(username){
  const $online = $.atom(null);

  const channel = supabase.channel('#online', {
    config: {
      presence: {
        key: username
      }
    }
  })
    .subscribe(function(status){
      if (status === 'SUBSCRIBED') {
        channel.track({seen: Date.now()});
      }
    })
    .on('presence', {event: 'sync'}, changed)
    .on('presence', {event: 'join'}, joined)
    .on('presence', {event: 'leave'}, left);

  function changed(){
    $.reset($online, channel.presenceState());
  }

  function joined({key, newPresences}){
    $.swap($online, _.assoc(_, key, newPresences));
  }

  function left({key, leftPresences}){
    $.swap($online, _.dissoc(_, key));
  }

  return $online;
}

export function presence($online, usernames){
  return $.map(function(online){
    return _.reduce(function(memo, username){
      const seen = _.getIn(online, [username, 0, "seen"]);
      return _.assoc(memo, username, seen || 0);
    }, {}, usernames);
  }, $online);
}
