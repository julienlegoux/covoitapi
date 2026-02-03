import "reflect-metadata";
import { container } from "tsyringe";
import { beforeEach } from "vitest";
beforeEach(() => {
    container.clearInstances();
});
export function createMockUserRepository() {
    return {
        findById: vi.fn(),
        findByEmail: vi.fn(),
        create: vi.fn(),
        existsByEmail: vi.fn(),
    };
}
export function createMockPasswordService() {
    return {
        hash: vi.fn(),
        verify: vi.fn(),
    };
}
export function createMockEmailService() {
    return {
        sendWelcomeEmail: vi.fn(),
        send: vi.fn(),
    };
}
export function createMockJwtService() {
    return {
        sign: vi.fn(),
        verify: vi.fn(),
    };
}
