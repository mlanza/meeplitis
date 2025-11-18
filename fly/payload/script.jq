# script.jq — pretty outer object; inline selected top-level arrays as compact

($ARGS.named.inline // ["events"]) as $INLINE |

def inline_array:
  "[ " + (map(tojson) | join(", ")) + " ]";

def kv($k; $v):
  "  \"" + $k + "\": " + $v;

. as $obj
| if ($obj|type) != "object"
  then tojson
  else
    "{\n" +
    ($obj
     | keys
     | map(. as $k |
         if (($INLINE | index($k)) != null) and (($obj[$k]|type)=="array")
         then kv($k; ($obj[$k] | inline_array))
         else kv($k; ($obj[$k] | tojson))
         end
       )
     | join(",\n")
    )
    + "\n}"
  end
