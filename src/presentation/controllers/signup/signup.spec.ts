import {
	InvalidParamError,
	MissingParamError,
	ServerError,
} from '../../errors';
import { SignUpController } from './signup';
import type {
	AccountModel,
	AddAccount,
	AddAccountModel,
	EmailValidator,
} from './signup-protocols';

const makeEmailValidator = (
	behavior: (email: string) => boolean = () => true,
): EmailValidator => {
	return {
		isValid: behavior,
	};
};

const makeAddAccount = (): AddAccount => {
	class AddAccountStub implements AddAccount {
		add(account: AddAccountModel): AccountModel {
			const fakeAccount = {
				id: 'valid_id',
				name: 'Jhon Doe',
				email: 'valid_email@mail.com',
				password: 'valid_password',
			};

			return fakeAccount;
		}
	}
	return new AddAccountStub();
};

interface SutTypes {
	sut: SignUpController;
	emailValidatorStub: EmailValidator;
	addAccountStub: AddAccount;
}

const makeSut = (): SutTypes => {
	const emailValidatorStub = makeEmailValidator();
	const addAccountStub = makeAddAccount();
	const sut = new SignUpController(emailValidatorStub, addAccountStub);
	return {
		sut,
		emailValidatorStub,
		addAccountStub,
	};
};

describe('SignUp Controller', () => {
	it('Should return 400 if no name is provided', () => {
		const { sut } = makeSut();
		const httpRequest = {
			body: {
				email: 'any_email@mail.com',
				password: 'any_password',
				passwordConfirmation: 'any_password',
			},
		};

		const httpResponse = sut.handle(httpRequest);
		expect(httpResponse.statusCode).toBe(400);
		expect(httpResponse.body).toEqual(new MissingParamError('name'));
	});

	it('Should return 400 if no email is provided', () => {
		const { sut } = makeSut();
		const httpRequest = {
			body: {
				name: 'Jhon Doe',
				password: 'any_password',
				passwordConfirmation: 'any_password',
			},
		};

		const httpResponse = sut.handle(httpRequest);
		expect(httpResponse.statusCode).toBe(400);
		expect(httpResponse.body).toEqual(new MissingParamError('email'));
	});

	it('Should return 400 if no password is provided', () => {
		const { sut } = makeSut();
		const httpRequest = {
			body: {
				name: 'Jhon Doe',
				email: 'any_email@mail.com',
				passwordConfirmation: 'any_password',
			},
		};

		const httpResponse = sut.handle(httpRequest);
		expect(httpResponse.statusCode).toBe(400);
		expect(httpResponse.body).toEqual(new MissingParamError('password'));
	});

	it('Should return 400 if no password confirmation is provided', () => {
		const { sut } = makeSut();
		const httpRequest = {
			body: {
				name: 'Jhon Doe',
				email: 'any_email@mail.com',
				password: 'any_password',
			},
		};

		const httpResponse = sut.handle(httpRequest);
		expect(httpResponse.statusCode).toBe(400);
		expect(httpResponse.body).toEqual(
			new MissingParamError('passwordConfirmation'),
		);
	});

	it('Should return 400 if password confirmation fails', () => {
		const { sut } = makeSut();
		const httpRequest = {
			body: {
				name: 'Jhon Doe',
				email: 'any_email@mail.com',
				password: 'any_password',
				passwordConfirmation: 'invalid_password',
			},
		};

		const httpResponse = sut.handle(httpRequest);
		expect(httpResponse.statusCode).toBe(400);
		expect(httpResponse.body).toEqual(
			new InvalidParamError('passwordConfirmation'),
		);
	});

	it('Should return 400 if an invalid email is provided', () => {
		const { sut, emailValidatorStub } = makeSut();
		jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false);

		const httpRequest = {
			body: {
				name: 'Jhon Doe',
				email: 'invalid_email@mail.com',
				password: 'any_password',
				passwordConfirmation: 'any_password',
			},
		};

		const httpResponse = sut.handle(httpRequest);
		expect(httpResponse.statusCode).toBe(400);
		expect(httpResponse.body).toEqual(new InvalidParamError('email'));
	});

	it('Should call EmailValidator with correct email', () => {
		const { sut, emailValidatorStub } = makeSut();
		const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid');

		const httpRequest = {
			body: {
				name: 'Jhon Doe',
				email: 'any_email@mail.com',
				password: 'any_password',
				passwordConfirmation: 'any_password',
			},
		};

		sut.handle(httpRequest);
		expect(isValidSpy).toHaveBeenCalledWith('any_email@mail.com');
	});

	it('Should return 500 if EmailValidator throws', () => {
		const emailValidatorStub = makeEmailValidator(() => {
			throw new Error();
		});
		const addAccountStub = makeAddAccount();
		const sut = new SignUpController(emailValidatorStub, addAccountStub);

		const httpRequest = {
			body: {
				name: 'Jhon Doe',
				email: 'any_email@mail.com',
				password: 'any_password',
				passwordConfirmation: 'any_password',
			},
		};

		const httpResponse = sut.handle(httpRequest);
		expect(httpResponse.statusCode).toBe(500);
		expect(httpResponse.body).toEqual(new ServerError());
	});

	it('Should call AddAccount with correct values', () => {
		const { sut, addAccountStub } = makeSut();
		const addSpy = jest.spyOn(addAccountStub, 'add');

		const httpRequest = {
			body: {
				name: 'Jhon Doe',
				email: 'valid_email@mail.com',
				password: 'valid_password',
				passwordConfirmation: 'valid_password',
			},
		};

		sut.handle(httpRequest);
		expect(addSpy).toHaveBeenCalledWith({
			name: 'Jhon Doe',
			email: 'valid_email@mail.com',
			password: 'valid_password',
		});
	});
});
