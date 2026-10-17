let clientProfile = `The client is a software engineer in the early stages of their career.

They are focused on professional development and continuous improvement across all areas of software engineering practice.

They are actively building experience through real-world tasks and reflecting on those tasks to identify transferable skills and areas for growth.`;

const setClientProfile = (profile: string): void => {
  const trimmedProfile = profile.trim();
  if (!trimmedProfile) {
    throw new Error("Client profile cannot be empty");
  }

  clientProfile = trimmedProfile;
};

export { clientProfile, setClientProfile };
