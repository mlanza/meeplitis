There are adjustments to be made.

The `loadPerspective` function presently passes in a perspective and internally you infer it is tied to a certain event id and you bind that to the cache at that address.  I don't like the address being inferred in the api.  I want the contract of `loadPerspective` to explicitly accept `at` (event id) as an argument.  I don't want a `perspective` address at all in the state.  It's unneeded.

The step for loading touches (the event history) will have no immediate effect.  This is just ensuring the internal timeline is up to date with reality. The shell cares, however, because it can see when the user falls a frame behind the present.  We'll address that point later.

The important idea is the cursor itself.  That is how we navigate the timeline.  Internally in the state I want there to be a `cursor` address.  That's where `pos`, `at`, and `max` go.  As `touches` gets refreshed, so must the cursor bounds, all at once, always transactionally.

The cardinal rule is this: it must be impossible to navigate to a position in the timeline which doesn't exist (e.g., check `touches`) and for which the cached perspective is not yet present.  In this way, the shell notices a request for navigation, determines what event id exists at that offset (e.g., where it's going; it can determine the `at` address using a common function in the core), and loads the perspective into the cache.  When the requested navigation at that moment becomes in-bounds, the shell calls `reposition` according to the user's request.  The named convenience functions (`forward`, `backward`, etc.) use `reposition` and thus are similarly forced to be valid (e.g., make illegal states unrepresentable).

I don't like some of your verb names. `to_start` is called `inception`.  `to_end` is called `present`.

I also need you to ensure that the CLI tool's `--help` accurately reflects the options which can be passed to it.

I want to introduce `direction` as a value in the cursor.  Initially, it will be -1 meaning backwards.  There will be constants `FORWARD` and `BACKWARD` set to 1 and -1, respectively that name this.  Thus, the direction will always be one or the other.  It starts off with a backward orientation because the timeline always begins at the present. At that moment, there is no way to go but backward.   However, if touches gets updates and the position is thus in the past, at that moment, the direction must revert to forward.

The strong reason `direction` exists is to facilitate pre-caching.  Whenever a positioning lands, the user arrives at where he is (the present initially), or he navigates and lands elsewhere, it must always be possible to see where the next step would land (and now we can!), and thus, to call out, and preload the cache.  Since loading a perspective is not tied to navigation, this just situates the user for quicker navigation.  It anticipates.

Also note that the original `reel.js` implements an `at` command which permits the user to designate a destination.  When this is applied, we assume forward direction, transactionally.
