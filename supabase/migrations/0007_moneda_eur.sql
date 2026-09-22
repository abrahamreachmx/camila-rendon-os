-- Soporte para euros.
--
-- Camila ya facturó una campaña en euros (Rabanne) y el modelo sólo aceptaba
-- pesos, dólares y pesos colombianos. Se amplían los cuatro checks que listan
-- monedas; el consolidado a pesos sigue saliendo de fx_rate_mxn por campaña.

alter table campaigns  drop constraint if exists campaigns_currency_check;
alter table campaigns  add  constraint campaigns_currency_check
  check (currency in ('MXN','USD','COP','EUR'));

alter table services   drop constraint if exists services_currency_check;
alter table services    add constraint services_currency_check
  check (currency in ('MXN','USD','COP','EUR'));

alter table quotes     drop constraint if exists quotes_currency_check;
alter table quotes      add constraint quotes_currency_check
  check (currency in ('MXN','USD','COP','EUR'));

alter table settings   drop constraint if exists settings_default_currency_check;
alter table settings    add constraint settings_default_currency_check
  check (default_currency in ('MXN','USD','COP','EUR'));
