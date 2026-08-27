<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '08123456789',
            'address' => 'Jl. Test No. 1',
            'medical_conditions' => 'Gagal Ginjal Kronis Stage 5',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('status', 'Registrasi berhasil, silakan masuk ke akun Anda.');

        $this->assertDatabaseHas('patients', [
            'medical_conditions' => 'Gagal Ginjal Kronis Stage 5',
        ]);
    }
}
