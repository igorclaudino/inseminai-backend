# Breeders API — Documentação Legada

> Esta API foi removida na decisão de utilizar animais cadastrados como reprodutores.
> Mantida aqui para referência caso seja necessário reintroduzir um cadastro separado de reprodutores no futuro.

## Contexto da remoção

A tela de cadastro de reprodutores foi removida. Todos os reprodutores agora são animais
machos cadastrados na fazenda (`sex: male`). O rastreamento de fertilidade (`fertilityScore`,
`totalInseminations`, `pregnanciesAsBreeder`) foi migrado para o modelo `Animal`.

---

## Endpoints que existiam

### `POST /api/breeders`
Cadastrava um reprodutor, opcionalmente vinculado a um animal da fazenda.

**Body:**
```json
{
  "animalId": "uuid-opcional",
  "name": "Imperador do Sertão",
  "species": "cattle",
  "breed": "Nelore",
  "totalInseminations": 12,
  "pregnancies": 9
}
```
Se `animalId` fosse informado, `name`/`species`/`breed` eram preenchidos do animal automaticamente.

---

### `GET /api/breeders`
Listava reprodutores ativos da fazenda.

**Query:** `species`, `page`, `limit`

**Response:**
```json
{
  "data": [{
    "id": "uuid",
    "name": "Imperador do Sertão",
    "species": "cattle",
    "breed": "Nelore",
    "fertilityScore": 88,
    "estimatedScore": 88,
    "totalInseminations": 24,
    "pregnancies": 19,
    "active": true
  }],
  "total": 3, "page": 1, "limit": 20, "totalPages": 1
}
```

---

### `GET /api/breeders/:id`
Retornava detalhes de um reprodutor.

---

### `PUT /api/breeders/:id`
Atualizava dados do reprodutor. Body: mesmos campos de `POST`, todos opcionais.

---

### `DELETE /api/breeders/:id` _(admin)_
Exclusão lógica (`active: false`).

---

## Modelo Breeder (schema Prisma legado)

```prisma
model Breeder {
  id                 String    @id @default(uuid())
  species            Species
  name               String
  breed              String
  fertilityScore     Int       @default(0)
  estimatedScore     Int       @default(0)
  totalInseminations Int       @default(0)
  pregnancies        Int       @default(0)
  active             Boolean   @default(true)
  deletedAt          DateTime?
  createdAt          DateTime  @default(now())

  farmId   String
  farm     Farm    @relation(fields: [farmId], references: [id])
  animalId String? @unique
  animal   Animal? @relation(fields: [animalId], references: [id])

  reproductiveEvents ReproductiveEvent[]
  predictions        Prediction[]

  @@index([farmId, active, species])
}
```

---

## Como reintroduzir

1. Recriar o modelo `Breeder` no schema Prisma
2. Criar migration para recriar a tabela
3. Recriar `src/breeders/` com controller, service e DTOs
4. Reregistrar `BreedersModule` em `app.module.ts` e `reproduction.module.ts`
5. Reverter `ReproductiveEvent.sireId` → `breederId` e `Prediction.sireId` → `breederId` para FK em `Breeder`
