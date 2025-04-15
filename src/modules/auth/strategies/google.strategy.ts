import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common'; // Added Logger
import * as dotenv from 'dotenv';

dotenv.config(); // Make sure environment variables are loaded

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.APP_URL 
      ? `http://localhost:8085/api/auth/google/callback`
      : 'http://localhost:8085/api/auth/google/callback';

    if (!clientID || !clientSecret) {
      throw new Error('Google OAuth Client ID or Secret not configured in .env');
    }

    super({
      clientID: clientID,
      clientSecret: clientSecret,
      callbackURL: callbackURL, // Use the constructed callback URL
      scope: ['email', 'profile'],
    });

    this.logger.log(`Google Strategy initialized. Callback URL: ${callbackURL}`);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile, // Use Profile type from passport-google-oauth20
    done: VerifyCallback,
  ): Promise<any> {
    this.logger.log(`Validating Google profile for email: ${profile.emails?.[0]?.value}`);
    const { id, name, emails, photos } = profile;

    // Basic validation: Ensure email exists
    if (!emails || !emails[0] || !emails[0].value) {
       this.logger.error('Google profile did not return an email address.');
       return done(new Error('Google profile did not return an email address.'));
    }

    const user = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      firstName: name?.givenName || '', // Handle potentially missing names
      lastName: name?.familyName || '',
      profilePicture: photos?.[0]?.value,
      oauthAccessToken: accessToken, // Store tokens if needed for future API calls
      oauthRefreshToken: refreshToken, // Be cautious storing refresh tokens
    };

    // The 'done' callback passes the extracted user object to the route handler guard
    done(null, user);
  }
}
