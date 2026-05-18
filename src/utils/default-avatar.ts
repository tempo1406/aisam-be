export const getDefaultAvatarUrl = (): string => {
  return (
    process.env.DEFAULT_AVATAR_URL ||
    'https://ik.imagekit.io/b78xd9lggb/uploads/avatar_G_Kxb2Gr4.jpg'
  );
};
