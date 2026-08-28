# Mutation gate

`src/services/mutation-gate.ts` is the only place money rules live. Handlers call it **before** `NinenineClient` HTTP.

| Tool | `NINENINE_ALLOW_MUTATIONS` | `explicit_user_intent` | Guest token |
| --- | --- | --- | --- |
| request-ride / cancel-ride | required | required | rejected |
| logout | no | required | allowed |
