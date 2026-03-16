export const getUserProfile = async (req, res) => {
  try {

    const user = req.user;

    res.json({
      id: user.id,
      userId: user.user_id,
      email: user.email,
      role: user.role,
      createdAt: user.created_at
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to fetch profile"
    });

  }
};