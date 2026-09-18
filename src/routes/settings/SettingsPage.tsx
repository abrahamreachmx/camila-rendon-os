import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandTab } from '@/routes/settings/tabs/BrandTab'
import { CommissionTab } from '@/routes/settings/tabs/CommissionTab'
import { PresetsTab } from '@/routes/settings/tabs/PresetsTab'
import { ServicesTab } from '@/routes/settings/tabs/ServicesTab'
import { StatusesTab } from '@/routes/settings/tabs/StatusesTab'

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Configuración"
        description="Tarifas, estatus, comisión, plazos de pago y la marca que sale en el PDF."
      />
      <Tabs defaultValue="tarifas">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
          <TabsTrigger value="estatus">Estatus</TabsTrigger>
          <TabsTrigger value="comision">Comisión</TabsTrigger>
          <TabsTrigger value="plazos">Plazos de pago</TabsTrigger>
          <TabsTrigger value="marca">Marca del PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="tarifas"><ServicesTab /></TabsContent>
        <TabsContent value="estatus"><StatusesTab /></TabsContent>
        <TabsContent value="comision"><CommissionTab /></TabsContent>
        <TabsContent value="plazos"><PresetsTab /></TabsContent>
        <TabsContent value="marca"><BrandTab /></TabsContent>
      </Tabs>
    </>
  )
}
