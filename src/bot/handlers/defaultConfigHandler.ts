import { ConfigHandler } from "../bot";
import { setClientProfile } from "../../promptGenerator/clientProfile";

class DefaultConfigHandler implements ConfigHandler {
  async handle(
    operation: string,
    attribute: string,
    value: string,
  ): Promise<void> {
    if (operation === "set" && attribute === "profile") {
      setClientProfile(value);
    } else {
      console.log(`Unknown config command: ${operation} ${attribute}`);
    }
  }
}

export { DefaultConfigHandler };
