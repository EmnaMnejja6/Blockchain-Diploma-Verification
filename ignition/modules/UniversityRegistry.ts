import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DiplomaModule", (m) => {
  const universityRegistry = m.contract("UniversityRegistry");
  const diplomaRegistry = m.contract("DiplomaRegistry", [universityRegistry]);
  return { universityRegistry, diplomaRegistry };
});