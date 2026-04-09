import Lib            "lib/screenplay";
import ScreenplayMixin "mixins/screenplay-api";



actor {
  let state = Lib.newState();
  include ScreenplayMixin(state);
};
