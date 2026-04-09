import Map     "mo:core/Map";
import List    "mo:core/List";
import Time    "mo:core/Time";
import Types   "../types/screenplay";

module {
  // Sentinel character name used to store the active TTS provider.
  let providerSentinel : Text = "__provider__";

  public type State = {
    screenplays   : Map.Map<Types.ScreenplayId, Types.Screenplay>;
    voiceSettings : Map.Map<Types.ScreenplayId, List.List<Types.CharacterVoiceSetting>>;
  };

  public func newState() : State {
    {
      screenplays   = Map.empty<Types.ScreenplayId, Types.Screenplay>();
      voiceSettings = Map.empty<Types.ScreenplayId, List.List<Types.CharacterVoiceSetting>>();
    };
  };

  public func addScreenplay(
    state    : State,
    title    : Text,
    language : Text,
    content  : Text,
  ) : { #ok : Types.ScreenplayId; #err : Text } {
    let now = Time.now();
    let id = title # "-" # now.toText();
    let screenplay : Types.Screenplay = {
      id;
      title;
      language;
      content;
      createdAt = now;
    };
    state.screenplays.add(id, screenplay);
    #ok(id);
  };

  public func getScreenplay(
    state : State,
    id    : Types.ScreenplayId,
  ) : ?Types.Screenplay {
    state.screenplays.get(id);
  };

  public func listScreenplays(state : State) : [Types.ScreenplaySummary] {
    state.screenplays.entries().map(
      func((_, s) : (Types.ScreenplayId, Types.Screenplay)) : Types.ScreenplaySummary {
        { id = s.id; title = s.title; language = s.language; createdAt = s.createdAt };
      }
    ).toArray();
  };

  public func deleteScreenplay(
    state : State,
    id    : Types.ScreenplayId,
  ) : { #ok; #err : Text } {
    if (state.screenplays.containsKey(id)) {
      state.screenplays.remove(id);
      state.voiceSettings.remove(id);
      #ok;
    } else {
      #err("Screenplay not found");
    };
  };

  // Saves voice settings for all characters plus an optional active provider.
  // The active provider is stored as a sentinel entry with character == "__provider__"
  // and voiceUri == the provider id (e.g. "kokoro", "web-speech").
  public func saveVoiceSettings(
    state        : State,
    screenplayId : Types.ScreenplayId,
    settings     : [Types.CharacterVoiceSetting],
    activeProvider : ?Text,
  ) : { #ok; #err : Text } {
    if (not state.screenplays.containsKey(screenplayId)) {
      return #err("Screenplay not found");
    };
    let list = List.empty<Types.CharacterVoiceSetting>();
    for (s in settings.values()) {
      // Skip any sentinel entries the caller may have accidentally included.
      if (s.character != providerSentinel) {
        list.add(s);
      };
    };
    // Persist active provider as a sentinel entry.
    let provider = switch (activeProvider) {
      case (?p) { p };
      case null { "kokoro" };
    };
    list.add({
      character    = providerSentinel;
      voiceUri     = provider;
      pitch        = 1.0;
      rate         = 1.0;
      providerType = ?provider;
    });
    state.voiceSettings.add(screenplayId, list);
    #ok;
  };

  // Returns character voice settings (excluding the sentinel) with providerType
  // defaulting to "kokoro" when absent.
  public func getVoiceSettings(
    state        : State,
    screenplayId : Types.ScreenplayId,
  ) : [Types.CharacterVoiceSetting] {
    switch (state.voiceSettings.get(screenplayId)) {
      case null { [] };
      case (?list) {
        list.toArray().filter(
          func(s : Types.CharacterVoiceSetting) : Bool {
            s.character != providerSentinel
          }
        ).map<Types.CharacterVoiceSetting, Types.CharacterVoiceSetting>(
          func(s : Types.CharacterVoiceSetting) : Types.CharacterVoiceSetting {
            switch (s.providerType) {
              case null { { s with providerType = ?"kokoro" } };
              case (?_) { s };
            }
          }
        );
      };
    };
  };

  // Returns the active TTS provider for a screenplay. Defaults to "kokoro".
  public func getActiveProvider(
    state        : State,
    screenplayId : Types.ScreenplayId,
  ) : Text {
    switch (state.voiceSettings.get(screenplayId)) {
      case null { "kokoro" };
      case (?list) {
        switch (list.find(func(s : Types.CharacterVoiceSetting) : Bool { s.character == providerSentinel })) {
          case null   { "kokoro" };
          case (?s)   { s.voiceUri };
        };
      };
    };
  };
};
