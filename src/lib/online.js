import supabase from "./supabase.js";
import _ from "./atomic_/core.js";
import $ from "./atomic_/reactives.js";

export function online(username){
  const $online = $.cell(null);

  const channel = supabase.channel('#online', {
    config: {
      presence: {
        key: username
      }
    }
  });

  channel
    .on('presence', {event: 'sync'}, changed)
    .subscribe();

  channel.track({seen: Date.now()});

  window.onfocus = function(){
    channel.track({seen: Date.now()});
  }

  function changed(){
    _.reset($online, channel.presenceState());
  }

  return $online;
}

export function seats($online, usernames){
  return $.map(function(online){
    return _.reduce(function(memo, username){
      return _.assoc(memo, username, _.contains(online, username));
    }, {}, usernames);
  }, $online);
}
