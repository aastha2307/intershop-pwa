import { at } from '../../framework';
import { LoginPage } from '../../pages/account/login.page';
import { MyAccountPage } from '../../pages/account/my-account.page';
import { Registration, RegistrationPage, sensibleDefaults } from '../../pages/account/registration.page';
import { HomePage } from '../../pages/home.page';

const _ = {
  user: {
    login: `testuser${new Date().getTime()}@test.intershop.de`,
    ...sensibleDefaults,
    companyName1: 'Big Foods',
  } as Registration,
};

describe('New B2B User', () => {
  describe('first time registering', () => {
    before(() => HomePage.navigateTo());

    it('should click register link and land at registration page', () => {
      at(HomePage, page => {
        page.header.gotoRegistrationPage();
      });
      at(RegistrationPage);
    });

    it('should fill in registration form an submit', () => {
      at(RegistrationPage, page => {
        page.fillForm(_.user);
        page.acceptTAC();
        page.submitAndObserve().its('statusMessage').should('equal', '201 (Created)');
      });
    });

    it('should be at my account page and logged in', () => {
      at(MyAccountPage, page => {
        page.header.myAccountLink.should('have.text', `${_.user.firstName} ${_.user.lastName}`);
      });
    });

    it('should log out and log in and log out again', () => {
      at(MyAccountPage, page => {
        page.header.logout();
      });
      at(HomePage, page => {
        page.header.gotoLoginPage();
      });
      at(LoginPage, page => {
        page.fillForm(_.user.login, _.user.password);
        page.submit().its('status').should('equal', 200);
      });
      at(MyAccountPage, page => {
        page.header.myAccountLink.should('have.text', `${_.user.firstName} ${_.user.lastName}`);
      });
      at(MyAccountPage, page => {
        page.header.logout();
      });
      at(HomePage);
    });
  });

  describe('second time registering', () => {
    before(() => RegistrationPage.navigateTo());

    it('should fill in registration form', () => {
      at(RegistrationPage, page => {
        page.fillForm(_.user);
        page.acceptTAC();
      });
    });

    it('should get an error when submitting', () => {
      at(RegistrationPage, page => {
        page.acceptTAC();
        page.submitAndObserve().its('statusMessage').should('equal', '409 (Conflict)');
        page.errorText.should('be.visible').and('contain', 'e-mail address already exists');
      });
    });

    it('should cancel and be redirected to home page', () => {
      at(RegistrationPage, page => {
        page.cancel();
      });

      at(HomePage);
    });
  });
});
