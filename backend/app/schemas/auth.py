from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import re


class RegisterRequest(BaseModel):
    nome: str
    email: EmailStr
    senha: str

    @field_validator("senha")
    @classmethod
    def senha_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Senha deve ter ao menos 8 caracteres")
        return v

    @field_validator("nome")
    @classmethod
    def nome_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Nome não pode ser vazio")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    nome: str
    email: str
    plano: str
    ativo: bool

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
