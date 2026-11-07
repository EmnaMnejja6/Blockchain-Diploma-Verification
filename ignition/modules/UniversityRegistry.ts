import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("UniversityRegistryModule", (m) => {
  const registry = m.contract("UniversityRegistry");

  return { registry };
});