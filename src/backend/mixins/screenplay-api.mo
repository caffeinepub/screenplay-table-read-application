import Types "../types/screenplay";
import Lib    "../lib/screenplay";

mixin (state : Lib.State) {

  public func addScreenplay(
    title    : Text,
    language : Text,
    content  : Text,
  ) : async { #ok : Types.ScreenplayId; #err : Text } {
    Lib.addScreenplay(state, title, language, content);
  };

  public query func getScreenplay(
    id : Types.ScreenplayId,
  ) : async ?Types.Screenplay {
    Lib.getScreenplay(state, id);
  };

  public query func listScreenplays() : async [Types.ScreenplaySummary] {
    Lib.listScreenplays(state);
  };

  public func deleteScreenplay(
    id : Types.ScreenplayId,
  ) : async { #ok; #err : Text } {
    Lib.deleteScreenplay(state, id);
  };

  // settings: per-character voice assignments.
  // activeProvider: optional TTS provider id ("kokoro", "web-speech", etc.).
  //   Defaults to "kokoro" when null.
  public func saveVoiceSettings(
    screenplayId   : Types.ScreenplayId,
    settings       : [Types.CharacterVoiceSetting],
    activeProvider : ?Text,
  ) : async { #ok; #err : Text } {
    Lib.saveVoiceSettings(state, screenplayId, settings, activeProvider);
  };

  public query func getVoiceSettings(
    screenplayId : Types.ScreenplayId,
  ) : async [Types.CharacterVoiceSetting] {
    Lib.getVoiceSettings(state, screenplayId);
  };

  // Returns the active TTS provider for a screenplay ("kokoro" by default).
  public query func getActiveProvider(
    screenplayId : Types.ScreenplayId,
  ) : async Text {
    Lib.getActiveProvider(state, screenplayId);
  };
};
