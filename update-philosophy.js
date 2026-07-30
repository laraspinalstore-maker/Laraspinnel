const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Set it in your environment before running this script.");
  process.exit(1);
}

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const setting = await db.collection('sitesettings').findOne({ key: 'philosophy_content' });
    if (setting && setting.value) {
      if (!setting.value.includes('<table')) {
        console.log("Found setting without table, appending table...");
        const tableHTML = `
<h3 class="text-xl font-bold text-brand-black pt-4 mb-2">At a Glance: Our Offerings</h3>
<div class="overflow-x-auto mb-6 border border-brand-border rounded-xl">
  <table class="w-full text-left text-sm text-brand-gray border-collapse">
    <thead class="bg-brand-light-gray text-brand-black font-semibold text-xs uppercase tracking-wider">
      <tr>
        <th class="px-4 py-3 border-b border-brand-border">Service / Product</th>
        <th class="px-4 py-3 border-b border-brand-border">Key Highlights</th>
        <th class="px-4 py-3 border-b border-brand-border">Primary Availability</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-brand-border">
      <tr class="hover:bg-brand-light-gray/50 transition-colors">
        <td class="px-4 py-3 font-semibold text-brand-black">Live Goats (Boer, Tellicherry, Naatu)</td>
        <td class="px-4 py-3">Pasture-raised, vet-inspected, traceable lineage</td>
        <td class="px-4 py-3">All 38 Districts in Tamil Nadu</td>
      </tr>
      <tr class="hover:bg-brand-light-gray/50 transition-colors">
        <td class="px-4 py-3 font-semibold text-brand-black">Bulk Fresh Mutton</td>
        <td class="px-4 py-3">Custom cuts, hygienic packaging, 100% organic</td>
        <td class="px-4 py-3">Villupuram & Surrounding Areas</td>
      </tr>
      <tr class="hover:bg-brand-light-gray/50 transition-colors">
        <td class="px-4 py-3 font-semibold text-brand-black">Festival Bookings (Bakrid)</td>
        <td class="px-4 py-3">Advance booking, no immediate upfront payment</td>
        <td class="px-4 py-3">Statewide Delivery</td>
      </tr>
    </tbody>
  </table>
</div>
`;
        await db.collection('sitesettings').updateOne({ key: 'philosophy_content' }, { $set: { value: setting.value + tableHTML } });
        console.log("Successfully updated database philosophy_content with table.");
      } else {
        console.log("Database already has a table.");
      }
    } else {
      console.log("No custom philosophy_content in DB, the code default will apply.");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
