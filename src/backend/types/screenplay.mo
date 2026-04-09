import Common "common";

module {
  public type ScreenplayId = Common.ScreenplayId;
  public type Timestamp    = Common.Timestamp;

  public type CharacterVoiceSetting = {
    character    : Text;
    voiceUri     : Text;
    pitch        : Float;
    rate         : Float;
    providerType : ?Text;
  };

  public type Screenplay = {
    id        : ScreenplayId;
    title     : Text;
    language  : Text;
    content   : Text;
    createdAt : Timestamp;
  };

  public type ScreenplaySummary = {
    id        : ScreenplayId;
    title     : Text;
    language  : Text;
    createdAt : Timestamp;
  };
};
