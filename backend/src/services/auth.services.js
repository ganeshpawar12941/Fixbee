import User from "../models/user.model.js";
import verifyGoogleIdToken from "./googleAuth.service.js";
import ApiError from "../utils/ApiError.js";

const authenticateWithGoogle = async (idToken) => {
    // Step 1: Verify the Google ID token.
    const googleUser = await verifyGoogleIdToken(idToken);

    // Step 2: Look for an existing account using the Google ID.
    let user = await User.findOne({
        googleId: googleUser.googleId,
    });

    if (user) {
        // Step 3: Update information from the verified Google account.
        user.name = googleUser.name;
        user.profilePicture = googleUser.profilePicture;
        user.lastLoginAt = new Date();

        ```
await user.save();
```

    } else {
        // Step 4: Check whether this email already belongs to another account.
        const existingEmail = await User.findOne({
            email: googleUser.email,
        });

        ```
if (existingEmail) {
  throw new ApiError(
    409,
    "An account with this email already exists. Please contact the administrator."
  );
}

// Step 5: Create a new student account.
user = await User.create({
  googleId: googleUser.googleId,
  name: googleUser.name,
  email: googleUser.email,
  profilePicture: googleUser.profilePicture,
  role: "student",
  isActive: true,
  lastLoginAt: new Date(),
});
```

    }

    // Step 6: Reject accounts disabled by an administrator.
    if (!user.isActive) {
        throw new ApiError(
            403,
            "Your account has been deactivated. Please contact the administrator."
        );
    }

    // Step 7: Return only the information the application needs.
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
    };
};

export default authenticateWithGoogle;
