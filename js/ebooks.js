// ====== JETBULARY EXECUTIVE EBOOKS & PDF GUIDES ======
const ebooks = {
    // 1. DATA: 100 FRASES MÁS USADAS EN ENTORNOS DE NEGOCIOS
    businessPhrases: [
        // SECCIÓN 1: APERTURA Y GESTIÓN DE REUNIONES (1-18)
        { num: 1, category: "Reuniones & Apertura", phrase: "Let's kick off the meeting by reviewing the agenda.", ipa: "/lɛts kɪk ɔf ðə ˈmitɪŋ baɪ rɪˈvjuɪŋ ði əˈʤɛndə/", spanish: "Empecemos la reunión revisando el orden del día.", tip: "Frase estándar en entornos corporativos anglosajones para dar comienzo formal." },
        { num: 2, category: "Reuniones & Apertura", phrase: "Could you please walk us through the latest quarterly figures?", ipa: "/kʊd ju pliz wɔk ʌs θru ðə ˈleɪtəst ˈkwɔrtərli ˈfɪɡjərz/", spanish: "¿Podrías guiarnos a través de las últimas cifras trimestrales?", tip: "'Walk someone through' significa explicar paso a paso con detalle." },
        { num: 3, category: "Reuniones & Apertura", phrase: "I'd like to hand it over to Sarah for the product update.", ipa: "/aɪd laɪk tu hænd ɪt ˈoʊvər tu ˈsɛrə fɔr ðə ˈprɑdʌkt ˈʌpˌdeɪt/", spanish: "Me gustaría cederle la palabra a Sarah para la actualización del producto.", tip: "Fórmula elegante para dar el turno de palabra a un colega." },
        { num: 4, category: "Reuniones & Apertura", phrase: "Let's make sure we are all on the same page regarding expectations.", ipa: "/lɛts meɪk ʃʊr wi ɑr ɔl ɑn ðə seɪm peɪʤ rɪˈɡɑrdɪŋ ˌɛkspɛkˈteɪʃənz/", spanish: "Asegurémonos de que todos estamos alineados respecto a las expectativas.", tip: "'On the same page' es la metáfora reina de alineamiento corporativo." },
        { num: 5, category: "Reuniones & Apertura", phrase: "To cut a long story short, the pilot launch exceeded our target.", ipa: "/tu kʌt ə lɔŋ ˈstɔri ʃɔrt ðə ˈpaɪlət lɔnʧ ɪkˈsidɪd ˈaʊər ˈtɑrɡɪt/", spanish: "En resumen / Para abreviar, el lanzamiento piloto superó nuestro objetivo.", tip: "Para sintetizar y llegar directo al dato clave sin rodeos." },
        { num: 6, category: "Reuniones & Apertura", phrase: "Can we take this discussion offline to avoid derailing the agenda?", ipa: "/kæn wi teɪk ðɪs dɪˈskʌʃən ˌɔfˈlaɪn tu əˈvɔɪd dɪˈreɪlɪŋ ði əˈʤɛndə/", spanish: "¿Podemos tratar este punto fuera de la reunión para no desviarnos del orden del día?", tip: "'Take offline' significa hablarlo en privado o después entre los involucrados." },
        { num: 7, category: "Reuniones & Apertura", phrase: "Let's circle back to this point once we have the financial forecast.", ipa: "/lɛts ˈsɜrkəl bæk tu ðɪs pɔɪnt wʌns wi hæv ðə fəˈnænʃəl ˈfɔrˌkæst/", spanish: "Retomemos este asunto en cuanto dispongamos de la previsión financiera.", tip: "'Circle back' es retomar un tema cuando haya más información disponible." },
        { num: 8, category: "Reuniones & Apertura", phrase: "Who is heading up this initiative moving forward?", ipa: "/hu ɪz ˈhɛdɪŋ ʌp ðɪs ɪˈnɪʃətɪv ˈmuvɪŋ ˈfɔrwərd/", spanish: "¿Quién va a liderar esta iniciativa de aquí en adelante?", tip: "'Head up' = liderar/dirigir; 'moving forward' = en adelante/hacia el futuro." },
        { num: 9, category: "Reuniones & Apertura", phrase: "What is the key takeaway from this morning's presentation?", ipa: "/wʌt ɪz ðə ki ˈteɪkəˌweɪ frʌm ðɪs ˈmɔrnɪŋz ˌprɛzənˈteɪʃən/", spanish: "¿Cuál es la conclusión principal de la presentación de esta mañana?", tip: "'Takeaway' es la lección práctica o aprendizaje esencial que te llevas." },
        { num: 10, category: "Reuniones & Apertura", phrase: "I want to touch base with everyone before signing the agreement.", ipa: "/aɪ wɑnt tu tʌʧ beɪs wɪð ˈɛvriˌwʌn bɪˈfɔr ˈsaɪnɪŋ ði əˈɡrimənt/", spanish: "Quiero ponerme en contacto / contrastar con todos antes de firmar el acuerdo.", tip: "'Touch base' es contactar brevemente para verificar el estado de las cosas." },
        { num: 11, category: "Reuniones & Apertura", phrase: "Let's summarize the key action items before we wrap up.", ipa: "/lɛts ˈsʌməˌraɪz ðə ki ˈækʃən ˈaɪtəmz bɪˈfɔr wi ræp ʌp/", spanish: "Resumamos los puntos de acción clave antes de terminar la reunión.", tip: "'Action items' = tareas asignadas concretas; 'wrap up' = dar por concluido." },
        { num: 12, category: "Reuniones & Apertura", phrase: "Does anyone have any further questions or comments to add?", ipa: "/dʌz ˈɛniˌwʌn hæv ˈɛni ˈfɜrðər ˈkwɛsʧənz ɔr ˈkɑmɛnts tu æd/", spanish: "¿Alguien tiene alguna pregunta o comentario adicional que añadir?", tip: "Cierre profesional abierto a la participación de los asistentes." },
        { num: 13, category: "Reuniones & Apertura", phrase: "Let's dive right into the core issues on today's agenda.", ipa: "/lɛts daɪv raɪt ˈɪntu ðə kɔr ˈɪʃuz ɑn təˈdeɪz əˈʤɛndə/", spanish: "Vayamos directos al grano con los asuntos centrales del orden del día.", tip: "'Dive into' transmite dinamismo y enfoque inmediato." },
        { num: 14, category: "Reuniones & Apertura", phrase: "Could you please elaborate on that last point for clarity?", ipa: "/kʊd ju pliz ɪˈlæbəˌreɪt ɑn ðæt læst pɔɪnt fɔr ˈklɛrɪti/", spanish: "¿Podrías detallar un poco más ese último punto para mayor claridad?", tip: "Manera educada y profesional de pedir que profundicen en un dato." },
        { num: 15, category: "Reuniones & Apertura", phrase: "We need to address the elephant in the room regarding the budget deficit.", ipa: "/wi nid tu əˈdrɛs ði ˈɛləfənt ɪn ðə rum rɪˈɡɑrdɪŋ ðə ˈbʌʤɪt ˈdɛfəsət/", spanish: "Debemos abordar el problema evidente del que nadie habla sobre el déficit.", tip: "'Elephant in the room' = un problema enorme y evidente que todos evitan." },
        { num: 16, category: "Reuniones & Apertura", phrase: "Thank you all for taking the time to join this call on short notice.", ipa: "/θæŋk ju ɔl fɔr ˈteɪkɪŋ ðə taɪm tu ʤɔɪn ðɪs kɔl ɑn ʃɔrt ˈnoʊtəs/", spanish: "Gracias a todos por sacar tiempo para esta llamada con tan poco preaviso.", tip: "Cortesía ejecutiva obligatoria ante reuniones convocadas de urgencia." },
        { num: 17, category: "Reuniones & Apertura", phrase: "Let's keep this session focused and stick to the allocated time slots.", ipa: "/lɛts kip ðɪs ˈsɛʃən ˈfoʊkəst ænd stɪk tu ði ˈæləˌkeɪtəd taɪm slɑts/", spanish: "Mantengamos el enfoque y respetemos los tiempos asignados.", tip: "Para moderar reuniones eficientes sin retrasos." },
        { num: 18, category: "Reuniones & Apertura", phrase: "I'll circulate the meeting minutes by the end of business today.", ipa: "/aɪl ˈsɜrkjəˌleɪt ðə ˈmitɪŋ ˈmɪnəts baɪ ði ɛnd ʌv ˈbɪznəs təˈdeɪ/", spanish: "Distribuiré el acta de la reunión antes del final de la jornada laboral de hoy.", tip: "'Meeting minutes' = acta de reunión; 'COB / end of business' = final de jornada." },

        // SECCIÓN 2: NEGOCIACIÓN & CIERRE DE ACUERDOS (19-35)
        { num: 19, category: "Negociación & Acuerdos", phrase: "From our standpoint, this represents a genuine win-win scenario.", ipa: "/frʌm ˈaʊər ˈstændˌpɔɪnt ðɪs ˌrɛprɪˈzɛnts ə ˈʤɛnjuən wɪn-wɪn sɪˈnɛrioʊ/", spanish: "Desde nuestro punto de vista, esto representa un escenario donde todos ganan.", tip: "'Standpoint' = perspectiva; 'win-win' = beneficio mutuo asegurado." },
        { num: 20, category: "Negociación & Acuerdos", phrase: "We need some room to maneuver regarding the initial pricing tiers.", ipa: "/wi nid sʌm rum tu məˈnuvər rɪˈɡɑrdɪŋ ði ɪˈnɪʃəl ˈpraɪsɪŋ tɪrz/", spanish: "Necesitamos algo de margen de maniobra en cuanto a los tramos de precios iniciales.", tip: "'Room to maneuver' = flexibilidad para negociar." },
        { num: 21, category: "Negociación & Acuerdos", phrase: "Is this your absolute bottom line, or is there room for compromise?", ipa: "/ɪz ðɪs jʊər ˈæbsəˌlut ˈbɑtəm laɪn ɔr ɪz ðɛr rum fɔr ˈkɑmprəˌmaɪz/", spanish: "¿Es esta su última oferta innegociable, o hay margen para un acuerdo intermedio?", tip: "'Bottom line' en negociación = límite mínimo aceptable; 'compromise' = acuerdo mutuo." },
        { num: 22, category: "Negociación & Acuerdos", phrase: "Let's find common ground before entering contractual discussions.", ipa: "/lɛts faɪnd ˈkɑmən ɡraʊnd bɪˈfɔr ˈɛntərɪŋ kənˈtrækʧuəl dɪˈskʌʃənz/", spanish: "Encontremos puntos de coincidencia antes de pasar a las cláusulas contractuales.", tip: "'Common ground' = puntos de acuerdo que facilitan el pacto." },
        { num: 23, category: "Negociación & Acuerdos", phrase: "That proposal sounds reasonable, provided you guarantee the delivery dates.", ipa: "/ðæt prəˈpoʊzəl saʊndz ˈrizənəbəl prəˈvaɪdəd ju ˌɡɛrənˈti ðə dɪˈlɪvəri deɪts/", spanish: "La propuesta parece razonable, siempre y cuando garanticen las fechas de entrega.", tip: "'Provided that' = condición imprescindible para aceptar." },
        { num: 24, category: "Negociación & Acuerdos", phrase: "I'm willing to meet you halfway if you extend the payment terms.", ipa: "/aɪm ˈwɪlɪŋ tu mit ju ˈhæfˌweɪ ɪf ju ɪkˈstɛnd ðə ˈpeɪmənt tɜrmz/", spanish: "Estoy dispuesto a ceder y llegar a un punto medio si amplían el plazo de pago.", tip: "'Meet someone halfway' = ceder ambas partes equitativamente." },
        { num: 25, category: "Negociación & Acuerdos", phrase: "We have reached a deadlock and need a fresh perspective to proceed.", ipa: "/wi hæv riʧt ə ˈdɛdˌlɑk ænd nid ə frɛʃ pərˈspɛktɪv tu prəˈsid/", spanish: "Hemos llegado a un callejón sin salida y necesitamos una perspectiva nueva para avanzar.", tip: "'Deadlock' = bloqueo absoluto en una negociación." },
        { num: 26, category: "Negociación & Acuerdos", phrase: "This exclusivity clause could be a potential deal breaker for our board.", ipa: "/ðɪs ˌɛkskluˈsɪvəti klɔz kʊd bi ə pəˈtɛnʃəl dil ˈbreɪkər fɔr ˈaʊər bɔrd/", spanish: "Esta cláusula de exclusividad podría arruinar el acuerdo ante nuestro consejo.", tip: "'Deal breaker' = factor determinante que rompe el trato." },
        { num: 27, category: "Negociación & Acuerdos", phrase: "Can we lock in these rates for the duration of the multi-year contract?", ipa: "/kæn wi lɑk ɪn ðiz reɪts fɔr ðə dʊˈreɪʃən ʌv ðə ˈmʌlti-jɪr ˈkɑnˌtrækt/", spanish: "¿Podemos fijar / blindar estas tarifas durante toda la vigencia del contrato?", tip: "'Lock in' = blindar precios o condiciones frente a fluctuaciones futuras." },
        { num: 28, category: "Negociación & Acuerdos", phrase: "We need to conduct thorough due diligence before closing the acquisition.", ipa: "/wi nid tu kənˈdʌkt ˈθɜroʊ du ˈdɪləʤəns bɪˈfɔr ˈkloʊzɪŋ ði ˌækwəˈzɪʃən/", spanish: "Debemos realizar una auditoría exhaustiva antes de cerrar la adquisición.", tip: "'Due diligence' = auditoría y revisión legal/financiera rigurosa." },
        { num: 29, category: "Negociación & Acuerdos", phrase: "Let's put together a letter of intent outlining the agreed framework.", ipa: "/lɛts pʊt təˈɡɛðər ə ˈlɛtər ʌv ɪnˈtɛnt ˈaʊtˌlaɪnɪŋ ði əˈɡrid ˈfreɪmˌwɜrk/", spanish: "Redactemos una carta de intenciones que defina el marco pactado.", tip: "'Letter of intent (LOI)' = acuerdo preliminar previo al contrato formal." },
        { num: 30, category: "Negociación & Acuerdos", phrase: "I believe we have a tentative agreement on all major terms.", ipa: "/aɪ bɪˈliv wi hæv ə ˈtɛntətɪv əˈɡrimənt ɑn ɔl ˈmeɪʤər tɜrmz/", spanish: "Creo que hemos alcanzado un principio de acuerdo sobre los términos principales.", tip: "'Tentative agreement' = preacuerdo sujeto a firma o validación legal." },
        { num: 31, category: "Negociación & Acuerdos", phrase: "What kind of concessions are you prepared to put on the table?", ipa: "/wʌt kaɪnd ʌv kənˈsɛʃənz ɑr ju prɪˈpɛrd tu pʊt ɑn ðə ˈteɪbəl/", spanish: "¿Qué tipo de concesiones están dispuestos a poner sobre la mesa?", tip: "'Put on the table' = proponer formalmente en la negociación." },
        { num: 32, category: "Negociación & Acuerdos", phrase: "We are seeking a mutually beneficial long-term partnership.", ipa: "/wi ɑr ˈsikɪŋ ə ˈmjuʧuəli ˌbɛnəˈfɪʃəl lɔŋ-tɜrm ˈpɑrtnərˌʃɪp/", spanish: "Buscamos una alianza a largo plazo que sea beneficiosa para ambas partes.", tip: "Declara una intención constructiva y colaborativa de alto valor." },
        { num: 33, category: "Negociación & Acuerdos", phrase: "Let's shake hands on this and have legal draft the final document.", ipa: "/lɛts ʃeɪk hændz ɑn ðɪs ænd hæv ˈliɡəl dræft ðə ˈfaɪnəl ˈdɑkjəmənt/", spanish: "Cerremos el trato con un apretón de manos y dejemos que legal redacte el texto.", tip: "Fórmula tradicional de cierre de trato ('shake hands on something')." },
        { num: 34, category: "Negociación & Acuerdos", phrase: "Our legal department will review the non-disclosure agreement today.", ipa: "/ˈaʊər ˈliɡəl dɪˈpɑrtmənt wɪl rɪˈvju ðə nɑn-dɪˈskloʊʒər əˈɡrimənt təˈdeɪ/", spanish: "Nuestro departamento legal revisará el acuerdo de confidencialidad hoy.", tip: "'NDA' (Non-Disclosure Agreement) = contrato de confidencialidad estándar." },
        { num: 35, category: "Negociación & Acuerdos", phrase: "We cannot compromise on product quality standards under any circumstances.", ipa: "/wi ˈkænɑt ˈkɑmprəˌmaɪz ɑn ˈprɑdʌkt ˈkwɑləti ˈstændərdz ˈʌndər ˈɛni ˈsɜrkəmˌstænsəz/", spanish: "No podemos rebajar los estándares de calidad del producto bajo ningún concepto.", tip: "'Compromise on' = hacer concesiones que degraden la calidad." },

        // SECCIÓN 3: PRESENTACIONES & ANÁLISIS DE DATOS (36-52)
        { num: 36, category: "Presentaciones & Métricas", phrase: "As you can see on this chart, quarterly revenue has surged by twenty percent.", ipa: "/æz ju kæn si ɑn ðɪs ʧɑrt ˈkwɔrtərli ˈrɛvəˌnu hæz sɜrʤd baɪ ˈtwɛnti pərˈsɛnt/", spanish: "Como pueden ver en este gráfico, los ingresos trimestrales han aumentado un 20%.", tip: "'Surge' = incremento fuerte y rápido de una métrica." },
        { num: 37, category: "Presentaciones & Métricas", phrase: "Let me draw your attention to the breakdown of customer acquisition costs.", ipa: "/lɛt mi drɔ jʊər əˈtɛnʃən tu ðə ˈbreɪkˌdaʊn ʌv ˈkʌstəmər ˌækwəˈzɪʃən kɔsts/", spanish: "Permítanme llamar su atención sobre el desglose de costes de captación de clientes.", tip: "'Draw attention to' = enfocar el interés de la audiencia; 'breakdown' = desglose." },
        { num: 38, category: "Presentaciones & Métricas", phrase: "To put this into perspective, we have doubled our user base in six months.", ipa: "/tu pʊt ðɪs ˈɪntu pərˈspɛktɪv wi hæv ˈdʌbəld ˈaʊər ˈjuzər beɪs ɪn sɪks mʌnθs/", spanish: "Para poner esto en perspectiva, hemos duplicado la base de usuarios en seis meses.", tip: "Para contextualizar una métrica y hacer tangible su impacto." },
        { num: 39, category: "Presentaciones & Métricas", phrase: "This spike in churn rate is primarily attributed to seasonal factors.", ipa: "/ðɪs spaɪk ɪn ʧɜrn reɪt ɪz praɪˈmɛrəli əˈtrɪbjətəd tu ˈsizənəl ˈfæktərz/", spanish: "Este pico en la tasa de cancelación se debe principalmente a factores estacionales.", tip: "'Churn rate' = tasa de abandono de clientes; 'spike' = pico repentino." },
        { num: 40, category: "Presentaciones & Métricas", phrase: "Moving on to our next slide, let's examine the competitive landscape.", ipa: "/ˈmuvɪŋ ɑn tu ˈaʊər nɛkst slaɪd lɛts ɪɡˈzæmən ðə kəmˈpɛtətɪv ˈlændˌskeɪp/", spanish: "Pasando a la siguiente diapositiva, examinemos el panorama competitivo.", tip: "Transición fluida y profesional entre partes de una presentación." },
        { num: 41, category: "Presentaciones & Métricas", phrase: "The data clearly indicates a steady upward trend across all demographics.", ipa: "/ðə ˈdeɪtə ˈklɪrli ˈɪndəˌkeɪts ə ˈstɛdi ˈʌpwərd trɛnd əˈkrɔs ɔl ˌdɛməˈɡræfɪks/", spanish: "Los datos señalan claramente una tendencia al alza constante en todos los segmentos.", tip: "'Steady upward trend' = crecimiento sostenido y fiable." },
        { num: 42, category: "Presentaciones & Métricas", phrase: "We need to optimize our conversion funnel to maximize return on investment.", ipa: "/wi nid tu ˈɑptəˌmaɪz ˈaʊər kənˈvɜrʒən ˈfʌnəl tu ˈmæksəˌmaɪz rɪˈtɜrn ɑn ɪnˈvɛstmənt/", spanish: "Debemos optimizar nuestro embudo de conversión para maximizar el ROI.", tip: "Vocabulario corporativo esencial de analítica y marketing digital." },
        { num: 43, category: "Presentaciones & Métricas", phrase: "Let's benchmark our performance against the top industry leaders.", ipa: "/lɛts ˈbɛnʧˌmɑrk ˈaʊər pərˈfɔrməns əˈɡɛnst ðə tɑp ˈɪndəstri ˈlidərz/", spanish: "Comparemos nuestro rendimiento con el de los líderes del sector.", tip: "'Benchmark against' = comparar métricas con estándares de excelencia." },
        { num: 44, category: "Presentaciones & Métricas", phrase: "This KPI demonstrates a substantial improvement in operational efficiency.", ipa: "/ðɪs keɪ-pi-aɪ ˈdɛmənˌstreɪts ə səbˈstænʃəl ɪmˈpruvmənt ɪn ˌɑpəˈreɪʃənəl ɪˈfɪʃənsi/", spanish: "Este indicador clave refleja una mejora sustancial en la eficiencia operativa.", tip: "'KPI' (Key Performance Indicator) = métrica de rendimiento fundamental." },
        { num: 45, category: "Presentaciones & Métricas", phrase: "Despite the headwinds in the supply chain, our margins remained resilient.", ipa: "/dɪˈspaɪt ðə ˈhɛdˌwɪndz ɪn ðə səˈplaɪ ʧeɪn ˈaʊər ˈmɑrʤənz rɪˈmeɪnd rɪˈzɪljənt/", spanish: "A pesar de las dificultades en la cadena de suministro, nuestros márgenes resistieron.", tip: "'Headwinds' = vientos en contra / dificultades externas del mercado." },
        { num: 46, category: "Presentaciones & Métricas", phrase: "To recap, our strategic priorities for Q3 center on expansion and retention.", ipa: "/tu ˈriˌkæp ˈaʊər strəˈtiʤɪk praɪˈɔrəˌtiz fɔr kju-θri ˈsɛntər ɑn ɪkˈspænʃən ænd rɪˈtɛnʃən/", spanish: "En resumen, nuestras prioridades estratégicas para el 3T se centran en expansión y retención.", tip: "'To recap' = recapitular / resumir las conclusiones principales." },
        { num: 47, category: "Presentaciones & Métricas", phrase: "I would like to open the floor to any inquiries from the audience.", ipa: "/aɪ wʊd laɪk tu ˈoʊpən ðə flɔr tu ˈɛni ɪnˈkwaɪriz frʌm ði ˈɔdiəns/", spanish: "Me gustaría abrir el turno de preguntas para los asistentes.", tip: "'Open the floor' = dar paso formal al turno de preguntas y respuestas." },
        { num: 48, category: "Presentaciones & Métricas", phrase: "This visual diagram illustrates the core architecture of the new cloud platform.", ipa: "/ðɪs ˈvɪʒuəl ˈdaɪəˌɡræm ˈɪləˌstreɪts ðə kɔr ˌɑrkəˈtɛkʧər ʌv ðə nu klaʊd ˈplætˌfɔrm/", spanish: "Este diagrama visual ilustra la arquitectura central de la nueva plataforma en la nube.", tip: "Para explicar esquemas técnicos y diagramas de flujo." },
        { num: 49, category: "Presentaciones & Métricas", phrase: "The figures speak for themselves regarding the success of this campaign.", ipa: "/ðə ˈfɪɡjərz spik fɔr ðəmˈsɛlvz rɪˈɡɑrdɪŋ ðə səkˈsɛs ʌv ðɪs kæmˈpeɪn/", spanish: "Las cifras hablan por sí solas en cuanto al éxito de esta campaña.", tip: "Para enfatizar que los resultados son contundentes e indiscutibles." },
        { num: 50, category: "Presentaciones & Métricas", phrase: "We have observed a significant shift in consumer behavior toward mobile transactions.", ipa: "/wi hæv əbˈzɜrvd ə sɪɡˈnɪfɪkənt ʃɪft ɪn kənˈsumər bɪˈheɪvjər təˈwɔrd ˈmoʊbəl trænˈzækʃənz/", spanish: "Hemos observado un cambio significativo en el comportamiento del consumidor hacia el móvil.", tip: "'Shift' = transformación o desplazamiento de tendencia." },
        { num: 51, category: "Presentaciones & Métricas", phrase: "Let me clarify the assumptions behind this growth projection.", ipa: "/lɛt mi ˈklɛrəˌfaɪ ði əˈsʌmpʃənz bɪˈhaɪnd ðɪs ɡroʊθ prəˈʤɛkʃən/", spanish: "Permítanme aclarar las premisas que fundamentan esta proyección de crecimiento.", tip: "'Assumptions' = hipótesis o premisas de base en un modelo financiero." },
        { num: 52, category: "Presentaciones & Métricas", phrase: "That concludes the presentation. Thank you very much for your attention.", ipa: "/ðæt kənˈkludz ðə ˌprɛzənˈteɪʃən θæŋk ju ˈvɛri mʌʧ fɔr jʊər əˈtɛnʃən/", spanish: "Con esto concluye la presentación. Muchas gracias por su atención.", tip: "Cierre limpio, profesional y directo para cualquier ponencia." },

        // SECCIÓN 4: CORREOS ELECTRÓNICOS & CORRESPONDENCIA EJECUTIVA (53-70)
        { num: 53, category: "Emails & Correspondencia", phrase: "I am writing to follow up on our discussion regarding the partnership proposal.", ipa: "/aɪ æm ˈraɪtɪŋ tu ˈfɑloʊ ʌp ɑn ˈaʊər dɪˈskʌʃən rɪˈɡɑrdɪŋ ðə ˈpɑrtnərˌʃɪp prəˈpoʊzəl/", spanish: "Le escribo para dar seguimiento a nuestra conversación sobre la propuesta de alianza.", tip: "La apertura de email de seguimiento más empleada en negocios internacionales." },
        { num: 54, category: "Emails & Correspondencia", phrase: "Please find attached the revised budget spreadsheet for your review.", ipa: "/pliz faɪnd əˈtæʧt ðə rɪˈvaɪzd ˈbʌʤɪt ˈsprɛdˌʃit fɔr jʊər rɪˈvju/", spanish: "Adjunto encontrará la hoja de cálculo del presupuesto revisado para su examen.", tip: "'Please find attached' = fórmula protocolaria estándar para adjuntos." },
        { num: 55, category: "Emails & Correspondencia", phrase: "I would appreciate your feedback on this draft at your earliest convenience.", ipa: "/aɪ wʊd əˈpriʃiˌeɪt jʊər ˈfidˌbæk ɑn ðɪs dræft æt jʊər ˈɜrliəst kənˈvinjəns/", spanish: "Agradecería sus comentarios sobre este borrador a la mayor brevedad posible.", tip: "'At your earliest convenience' = fórmula educada para pedir celeridad sin sonar agresivo." },
        { num: 56, category: "Emails & Correspondencia", phrase: "Thank you for bringing this critical matter to our immediate attention.", ipa: "/θæŋk ju fɔr ˈbrɪŋɪŋ ðɪs ˈkrɪtɪkəl ˈmætər tu ˈaʊər ɪˈmidiət əˈtɛnʃən/", spanish: "Gracias por poner este asunto tan relevante en nuestro conocimiento de inmediato.", tip: "Agradecimiento ejecutivo ante la notificación de una incidencia o riesgo." },
        { num: 57, category: "Emails & Correspondencia", phrase: "Could you please confirm receipt of the documents sent earlier today?", ipa: "/kʊd ju pliz kənˈfɜrm rɪˈsit ʌv ðə ˈdɑkjəmənts sɛnt ˈɜrliər təˈdeɪ/", spanish: "¿Podría confirmar la recepción de los documentos enviados hoy?", tip: "'Confirm receipt' = acuse de recibo; nótese que la 'p' en receipt es muda." },
        { num: 58, category: "Emails & Correspondencia", phrase: "Please let me know if you require any further clarification or assistance.", ipa: "/pliz lɛt mi noʊ ɪf ju rɪˈkwaɪr ˈɛni ˈfɜrðər ˌklɛrəfəˈkeɪʃən ɔr əˈsɪstəns/", spanish: "Quedo a su disposición en caso de que requiera aclaraciones adicionales o asistencia.", tip: "Cierre de cortesía indispensable para correos de soporte o propuestas." },
        { num: 59, category: "Emails & Correspondencia", phrase: "I look forward to hearing from you soon regarding the next steps.", ipa: "/aɪ lʊk ˈfɔrwərd tu ˈhɪrɪŋ frʌm ju sun rɪˈɡɑrdɪŋ ðə nɛkst stɛps/", spanish: "Quedo a la espera de sus noticias sobre los próximos pasos.", tip: "Recuerda: 'look forward to hearing' siempre lleva verbo en -ING." },
        { num: 60, category: "Emails & Correspondencia", phrase: "We apologize for any inconvenience this temporary disruption may have caused.", ipa: "/wi əˈpɑləˌʤaɪz fɔr ˈɛni ˌɪnkənˈvinjəns ðɪs ˈtɛmpəˌrɛri dɪsˈrʌpʃən meɪ hæv kɔzd/", spanish: "Lamentamos los inconvenientes que esta interrupción temporal haya podido causar.", tip: "Disculpa corporativa formal ante fallos técnicos o demoras de servicio." },
        { num: 61, category: "Emails & Correspondencia", phrase: "I will be out of the office until next Monday with limited access to email.", ipa: "/aɪ wɪl bi aʊt ʌv ði ˈɔfəs ənˈtɪl nɛkst ˈmʌndeɪ wɪð ˈlɪmətəd ˈækˌsɛs tu ˈimeɪl/", spanish: "Estaré fuera de la oficina hasta el próximo lunes con acceso limitado a mi correo.", tip: "Texto estándar para configuración del mensaje automático fuera de oficina (OOO)." },
        { num: 62, category: "Emails & Correspondencia", phrase: "For urgent inquiries, please reach out directly to my deputy, David.", ipa: "/fɔr ˈɜrʤənt ɪnˈkwaɪriz pliz riʧ aʊt dəˈrɛktli tu maɪ ˈdɛpjəti ˈdeɪvɪd/", spanish: "Para asuntos urgentes, ruego contacten directamente con mi adjunto, David.", tip: "Referencia a persona de contacto de relevo." },
        { num: 63, category: "Emails & Correspondencia", phrase: "Just a gentle reminder that the project deliverables are due tomorrow by 5 PM.", ipa: "/ʤʌst ə ˈʤɛntəl rɪˈmaɪndər ðæt ðə ˈprɑʤɛkt dɪˈlɪvərəbəlz ɑr du təˈmɔroʊ baɪ faɪv pi-ɛm/", spanish: "Un breve y cordial recordatorio de que los entregables del proyecto vencen mañana a las 17:00.", tip: "'Gentle reminder' suaviza el aviso de un plazo inminente." },
        { num: 64, category: "Emails & Correspondencia", phrase: "I would be grateful if you could loop in John on this email thread.", ipa: "/aɪ wʊd bi ˈɡreɪtfəl ɪf ju kʊd lup ɪn ʤɑn ɑn ðɪs ˈimeɪl θrɛd/", spanish: "Le agradecería que incluyese a John en copia en este hilo de correos.", tip: "'Loop someone in' = poner a alguien en copia / involucrar en la conversación." },
        { num: 65, category: "Emails & Correspondencia", phrase: "Please accept my apologies for the delayed response due to heavy travel.", ipa: "/pliz ækˈsɛpt maɪ əˈpɑləʤiz fɔr ðə dɪˈleɪd rɪˈspɑns du tu ˈhɛvi ˈtrævəl/", spanish: "Le ruego disculpe la demora en mi respuesta debida a viajes de trabajo.", tip: "Disculpa profesional cuando se tarda en contestar un correo." },
        { num: 66, category: "Emails & Correspondencia", phrase: "As per our telephone conversation earlier today, please find the invoice below.", ipa: "/æz pɜr ˈaʊər ˈtɛləˌfoʊn ˌkɑnvərˈseɪʃən ˈɜrliər təˈdeɪ pliz faɪnd ði ˈɪnvɔɪs bɪˈloʊ/", spanish: "Conforme a nuestra conversación telefónica de hoy, adjunto encontrará la factura.", tip: "'As per' = según lo acordado / conforme a lo hablado." },
        { num: 67, category: "Emails & Correspondencia", phrase: "Could you please keep me posted on any developments regarding this client?", ipa: "/kʊd ju pliz kip mi ˈpoʊstəd ɑn ˈɛni dɪˈvɛləpmənts rɪˈɡɑrdɪŋ ðɪs ˈklaɪənt/", spanish: "¿Podrías mantenerme al tanto de cualquier novedad respecto a este cliente?", tip: "'Keep someone posted' = mantener informado en tiempo real." },
        { num: 68, category: "Emails & Correspondencia", phrase: "I have copied our head of compliance on this email for visibility.", ipa: "/aɪ hæv ˈkɑpid ˈaʊər hɛd ʌv kəmˈplaɪəns ɑn ðɪs ˈimeɪl fɔr ˌvɪzəˈbɪləti/", spanish: "He puesto en copia a nuestro responsable de cumplimiento normativo para su conocimiento.", tip: "'For visibility' = para que esté al tanto y conste formalmente." },
        { num: 69, category: "Emails & Correspondencia", phrase: "Thank you in advance for your cooperation and prompt attention to this matter.", ipa: "/θæŋk ju ɪn ædˈvæns fɔr jʊər koʊˌɑpəˈreɪʃən ænd prɑmpt əˈtɛnʃən tu ðɪs ˈmætər/", spanish: "Le agradezco de antemano su colaboración y su rápida atención a este asunto.", tip: "Cierre corporativo que combina cortesía con expectativa de diligencia." },
        { num: 70, category: "Emails & Correspondencia", phrase: "Kind regards, / Warm regards, / Best regards,", ipa: "/kaɪnd rɪˈɡɑrdz wɔrm rɪˈɡɑrdz bɛst rɪˈɡɑrdz/", spanish: "Atentamente / Un cordial saludo,", tip: "Las tres despedidas ejecutivas más extendidas y elegantes en inglés." },

        // SECCIÓN 5: DIPLOMACIA, DESACUERDO & RESOLUCIÓN DE OBJECIONES (71-85)
        { num: 71, category: "Diplomacia & Objeciones", phrase: "I see where you're coming from, but we must also weigh the financial risk.", ipa: "/aɪ si wɛr jʊr ˈkʌmɪŋ frʌm bʌt wi mʌst ˈɔlsoʊ weɪ ðə fəˈnænʃəl rɪsk/", spanish: "Entiendo su punto de vista, pero también debemos sopesar el riesgo financiero.", tip: "'I see where you're coming from' valida al interlocutor antes de rebatirle." },
        { num: 72, category: "Diplomacia & Objeciones", phrase: "I'm afraid I have a few reservations regarding the proposed timeline.", ipa: "/aɪm əˈfreɪd aɪ hæv ə fju ˌrɛzərˈveɪʃənz rɪˈɡɑrdɪŋ ðə prəˈpoʊzd ˈtaɪmˌlaɪn/", spanish: "Me temo que tengo ciertas reservas respecto al calendario propuesto.", tip: "Fórmula británica ultra diplomática para expresar dudas o discrepancias." },
        { num: 73, category: "Diplomacia & Objeciones", phrase: "With all due respect, the evidence does not entirely support that conclusion.", ipa: "/wɪð ɔl du rɪˈspɛkt ðə ˈɛvədəns dʌz nɑt ɪnˈtaɪərli səˈpɔrt ðæt kənˈkluʒən/", spanish: "Con el debido respeto, los datos no respaldan del todo esa conclusión.", tip: "Para disentir firmemente sin perder la corrección ni la educación." },
        { num: 74, category: "Diplomacia & Objeciones", phrase: "That makes total sense, but could we explore an alternative workaround?", ipa: "/ðæt meɪks ˈtoʊtəl sɛns bʌt kʊd wi ɪkˈsplɔr ən ɔlˈtɜrnətɪv ˈwɜrkəˌraʊnd/", spanish: "Tiene todo el sentido, pero ¿podríamos explorar una solución alternativa?", tip: "'Workaround' = solución práctica para sortear un obstáculo temporal." },
        { num: 75, category: "Diplomacia & Objeciones", phrase: "I'm not entirely convinced that this pricing model is sustainable long-term.", ipa: "/aɪm nɑt ɪnˈtaɪərli kənˈvɪnst ðæt ðɪs ˈpraɪsɪŋ ˈmɑdəl ɪz səˈsteɪnəbəl lɔŋ-tɜrm/", spanish: "No estoy del todo convencido de que este modelo de precios sea sostenible a largo plazo.", tip: "Expresa escepticismo profesional sin ser destructivo." },
        { num: 76, category: "Diplomacia & Objeciones", phrase: "Let's agree to disagree on this point and focus on where our goals align.", ipa: "/lɛts əˈɡri tu ˌdɪsəˈɡri ɑn ðɪs pɔɪnt ænd ˈfoʊkəs ɑn wɛr ˈaʊər ɡoʊlz əˈlaɪn/", spanish: "Aceptemos nuestra discrepancia en este punto y centrémonos en donde sí coincidimos.", tip: "'Agree to disagree' = aceptar cordialmente una diferencia de criterio insalvable." },
        { num: 77, category: "Diplomacia & Objeciones", phrase: "Could you help me understand the rationale behind this sudden change?", ipa: "/kʊd ju hɛlp mi ˌʌndərˈstænd ðə ˌræʃəˈnæl bɪˈhaɪnd ðɪs ˈsʌdən ʧeɪnʤ/", spanish: "¿Podrías ayudarme a entender los motivos que justifican este cambio repentino?", tip: "'Rationale' = lógica o justificación fundamental de una decisión." },
        { num: 78, category: "Diplomacia & Objeciones", phrase: "I take your point, however we must adhere strictly to compliance regulations.", ipa: "/aɪ teɪk jʊər pɔɪnt haʊˈɛvər wi mʌst ædˈhɪr ˈstrɪktli tu kəmˈplaɪəns ˌrɛɡjəˈleɪʃənz/", spanish: "Acepto su argumento, sin embargo debemos acatar estrictamente la normativa legal.", tip: "'Take someone's point' = reconocer la validez de lo expuesto." },
        { num: 79, category: "Diplomacia & Objeciones", phrase: "Let's play devil's advocate for a moment: what if the market shifts?", ipa: "/lɛts pleɪ ˈdɛvəlz ˈædvəkət fɔr ə ˈmoʊmənt wʌt ɪf ðə ˈmɑrkət ʃɪfts/", spanish: "Hagamos de abogado del diablo por un momento: ¿y si el mercado cambia?", tip: "'Devil's advocate' = cuestionar una idea para poner a prueba su solidez." },
        { num: 80, category: "Diplomacia & Objeciones", phrase: "We need to mitigate this exposure before presenting the plan to investors.", ipa: "/wi nid tu ˈmɪtəˌɡeɪt ðɪs ɪkˈspoʊʒər bɪˈfɔr prɪˈzɛntɪŋ ðə plæn tu ɪnˈvɛstərz/", spanish: "Debemos mitigar esta exposición al riesgo antes de presentar el plan a inversores.", tip: "'Mitigate exposure' = reducir la vulnerabilidad o riesgo corporativo." },
        { num: 81, category: "Diplomacia & Objeciones", phrase: "I see potential in this concept, but the execution needs further refinement.", ipa: "/aɪ si pəˈtɛnʃəl ɪn ðɪs ˈkɑnsɛpt bʌt ði ˌɛksəˈkjuʃən nidz ˈfɜrðər rɪˈfaɪnmənt/", spanish: "Veo potencial en la idea, pero la ejecución requiere ser pulida con más detalle.", tip: "Feedback constructivo para motivar sin descuidar el rigor técnico." },
        { num: 82, category: "Diplomacia & Objeciones", phrase: "Let's take a step back and examine the root cause of this discrepancy.", ipa: "/lɛts teɪk ə stɛp bæk ænd ɪɡˈzæmən ðə rut kɔz ʌv ðɪs dɪˈskrɛpənsi/", spanish: "Demos un paso atrás y examinemos la causa raíz de esta discrepancia.", tip: "'Root cause' = causa fundamental y originaria de un problema." },
        { num: 83, category: "Diplomacia & Objeciones", phrase: "That is certainly a valid concern; let me explain how we plan to address it.", ipa: "/ðæt ɪz ˈsɜrtənli ə ˈvæləd kənˈsɜrn lɛt mi ɪkˈspleɪn haʊ wi plæn tu əˈdrɛs ɪt/", spanish: "Esa es una preocupación muy válida; permítame explicar cómo pensamos resolverla.", tip: "Para desarmar objeciones de clientes o inversores con empatía y solvencia." },
        { num: 84, category: "Diplomacia & Objeciones", phrase: "We need to find a sustainable balance between cost efficiency and quality.", ipa: "/wi nid tu faɪnd ə səˈsteɪnəbəl ˈbæləns bɪˈtwin kɔst ɪˈfɪʃənsi ænd ˈkwɑləti/", spanish: "Debemos encontrar un equilibrio sostenible entre contención de costes y calidad.", tip: "El equilibrio clásico de cualquier directivo o responsable de operaciones." },
        { num: 85, category: "Diplomacia & Objeciones", phrase: "I appreciate your candor in highlighting these operational bottlenecks.", ipa: "/aɪ əˈpriʃiˌeɪt jʊər ˈkændər ɪn ˈhaɪˌlaɪtɪŋ ðiz ˌɑpəˈreɪʃənəl ˈbɑtəlˌnɛks/", spanish: "Agradezco su franqueza al señalar estos cuellos de botella operativos.", tip: "'Candor' = sinceridad/franqueza; 'bottleneck' = cuello de botella." },

        // SECCIÓN 6: GESTIÓN DE PROYECTOS, PLAZOS & EFICIENCIA (86-100)
        { num: 86, category: "Proyectos & Plazos", phrase: "We are on track to deliver the milestone ahead of the projected schedule.", ipa: "/wi ɑr ɑn træk tu dɪˈlɪvər ðə ˈmaɪlˌstoʊn əˈhɛd ʌv ðə prəˈʤɛktəd ˈskɛʤul/", spanish: "Vamos por buen camino para entregar el hito antes del plazo previsto.", tip: "'On track' = dentro del plan; 'ahead of schedule' = adelantados al calendario." },
        { num: 87, category: "Proyectos & Plazos", phrase: "Let's make sure we don't drop the ball on this mission-critical deliverable.", ipa: "/lɛts meɪk ʃʊr wi doʊnt drɑp ðə bɔl ɑn ðɪs ˈmɪʃən-ˈkrɪtɪkəl dɪˈlɪvərəbəl/", spanish: "Asegurémonos de no cometer ningún descuido en este entregable crítico.", tip: "'Drop the ball' = cometer un fallo o descuidar una responsabilidad." },
        { num: 88, category: "Proyectos & Plazos", phrase: "We need to streamline our internal workflows to eliminate redundancies.", ipa: "/wi nid tu ˈstrimˌlaɪn ˈaʊər ɪnˈtɜrnəl ˈwɜrkˌfloʊz tu ɪˈlɪməˌneɪt rɪˈdʌndənsiz/", spanish: "Debemos agilizar nuestros flujos de trabajo internos para eliminar redundancias.", tip: "'Streamline' = optimizar procesos eliminando pasos innecesarios." },
        { num: 89, category: "Proyectos & Plazos", phrase: "Do we have sufficient bandwidth to take on this additional client?", ipa: "/du wi hæv səˈfɪʃənt ˈbændˌwɪdθ tu teɪk ɑn ðɪs əˈdɪʃənəl ˈklaɪənt/", spanish: "¿Tenemos suficiente capacidad / tiempo disponible en el equipo para asumir a este cliente?", tip: "'Bandwidth' en el mundo corporativo = capacidad de carga de trabajo del equipo." },
        { num: 90, category: "Proyectos & Plazos", phrase: "Let's identify the low-hanging fruit to achieve quick early wins.", ipa: "/lɛts aɪˈdɛntəˌfaɪ ðə loʊ-ˈhæŋɪŋ frut tu əˈʧiv kwɪk ˈɜrli wɪnz/", spanish: "Identifiquemos las tareas fáciles y directas para lograr victorias rápidas iniciales.", tip: "'Low-hanging fruit' = objetivos fácilmente alcanzables con poco esfuerzo." },
        { num: 91, category: "Proyectos & Plazos", phrase: "We are currently running behind schedule due to unexpected technical roadblocks.", ipa: "/wi ɑr ˈkɜrəntli ˈrʌnɪŋ bɪˈhaɪnd ˈskɛʤul du tu ˌʌnɪkˈspɛktəd ˈtɛknɪkəl ˈroʊdˌblɑks/", spanish: "Vamos con retraso en el calendario debido a bloqueos técnicos inesperados.", tip: "'Behind schedule' = con retraso; 'roadblocks' = obstáculos imprevistos." },
        { num: 92, category: "Proyectos & Plazos", phrase: "Who is designated as the primary point of contact for this account?", ipa: "/hu ɪz ˈdɛzɪɡˌneɪtəd æz ðə ˈpraɪˌmɛri pɔɪnt ʌv ˈkɑnˌtækt fɔr ðɪs əˈkaʊnt/", spanish: "¿Quién está designado como persona de contacto principal para esta cuenta?", tip: "'Point of contact (POC)' = interlocutor de referencia en un proyecto." },
        { num: 93, category: "Proyectos & Plazos", phrase: "We need to scale our cloud infrastructure to handle peak traffic demand.", ipa: "/wi nid tu skeɪl ˈaʊər klaʊd ˌɪnfrəˈstrʌkʧər tu ˈhændəl pik ˈtræfɪk dɪˈmænd/", spanish: "Debemos escalar nuestra infraestructura en la nube para soportar picos de tráfico.", tip: "'Scale' = ampliar capacidad de forma proporcional y elástica." },
        { num: 94, category: "Proyectos & Plazos", phrase: "Let's assign clear ownership and deadlines for each action item.", ipa: "/lɛts əˈsaɪn klɪr ˈoʊnərˌʃɪp ænd ˈdɛdˌlaɪnz fɔr iʧ ˈækʃən ˈaɪtəm/", spanish: "Asignemos responsables claros y fechas límite para cada tarea pendiente.", tip: "'Ownership' = responsabilidad asignada a una persona específica." },
        { num: 95, category: "Proyectos & Plazos", phrase: "This initiative is fully aligned with our corporate strategic roadmap.", ipa: "/ðɪs ɪˈnɪʃətɪv ɪz ˈfʊli əˈlaɪnd wɪð ˈaʊər ˈkɔrpərət strəˈtiʤɪk ˈroʊdˌmæp/", spanish: "Esta iniciativa está totalmente alineada con la hoja de ruta estratégica corporativa.", tip: "'Roadmap' = plan cronológico y estratégico de desarrollo a medio plazo." },
        { num: 96, category: "Proyectos & Plazos", phrase: "Let's pivot our marketing strategy to target emerging enterprise accounts.", ipa: "/lɛts ˈpɪvət ˈaʊər ˈmɑrkətɪŋ ˈstrætəʤi tu ˈtɑrɡɪt ɪˈmɜrʤɪŋ ˈɛntərˌpraɪz əˈkaʊnts/", spanish: "Cambiemos el rumbo de la estrategia de marketing hacia grandes cuentas corporativas.", tip: "'Pivot' = cambiar ágilmente de enfoque o modelo de negocio." },
        { num: 97, category: "Proyectos & Plazos", phrase: "We must ensure full regulatory compliance across all jurisdictions.", ipa: "/wi mʌst ɛnˈʃʊr fʊl ˈrɛɡjələˌtɔri kəmˈplaɪəns əˈkrɔs ɔl ˌʤʊrəsˈdɪkʃənz/", spanish: "Debemos garantizar el cumplimiento normativo total en todas las jurisdicciones.", tip: "Frase capital para empresas que operan a nivel internacional." },
        { num: 98, category: "Proyectos & Plazos", phrase: "Let's schedule a debrief session following the rollout to capture key lessons.", ipa: "/lɛts ˈskɛʤul ə ˈdiˌbrif ˈsɛʃən ˈfɑloʊɪŋ ðə ˈroʊlˌaʊt tu ˈkæpʧər ki ˈlɛsənz/", spanish: "Programemos una sesión de balance tras el despliegue para extraer lecciones clave.", tip: "'Debrief' = reunión post-proyecto para analizar aciertos y fallos." },
        { num: 99, category: "Proyectos & Plazos", phrase: "We need to future-proof our core systems against cyber security threats.", ipa: "/wi nid tu ˈfjuʧər-pruf ˈaʊər kɔr ˈsɪstəmz əˈɡɛnst ˈsaɪbər sɪˈkjʊrəti θrɛts/", spanish: "Debemos blindar nuestros sistemas de cara al futuro frente a amenazas de ciberseguridad.", tip: "'Future-proof' = preparar una tecnología o proceso para que no quede obsoleto ni vulnerable." },
        { num: 100, category: "Proyectos & Plazos", phrase: "Thank you all for your hard work; this milestone is a major step forward.", ipa: "/θæŋk ju ɔl fɔr jʊər hɑrd wɜrk ðɪs ˈmaɪlˌstoʊn ɪz ə ˈmeɪʤər stɛp ˈfɔrwərd/", spanish: "Gracias a todos por su esfuerzo; este hito representa un gran paso adelante.", tip: "Reconocimiento ejecutivo para cerrar un proyecto y mantener al equipo motivado." }
    ],

    // 2. DATA: GUÍA DEFINITIVA DE PHRASAL VERBS (100 REGISTROS)
    phrasalVerbs: [
        { num: 1, verb: "Give up", particle: "UP", meaning: "Rendirse / Abandonar un hábito", example: "Never give up on your dreams, keep practicing every day.", tip: "'Up' añade el sentido de compleción total de la acción." },
        { num: 2, verb: "Set up", particle: "UP", meaning: "Fundar, configurar o montar", example: "They set up a new technology startup in Silicon Valley.", tip: "Se usa tanto para empresas como para software o muebles." },
        { num: 3, verb: "Bring up", particle: "UP", meaning: "Mencionar un tema / Criar hijos", example: "Don't bring up the budget issues during the general meeting.", tip: "Traer una idea 'hacia arriba' a la luz de la conversación." },
        { num: 4, verb: "Show up", particle: "UP", meaning: "Aparecer / Presentarse en un lugar", example: "He showed up thirty minutes late to the interview.", tip: "Equivale a 'arrive' pero con matiz visual de hacerse presente." },
        { num: 5, verb: "Look up", particle: "UP", meaning: "Buscar información (diccionario, internet)", example: "If you don't know the word, look it up in the dictionary.", tip: "Si buscas una palabra o dato, siempre es 'look up'." },
        { num: 6, verb: "Turn up", particle: "UP", meaning: "Subir el volumen / Aparecer inesperadamente", example: "Can you turn up the volume? I can't hear the teacher.", tip: "Antónimo directo de 'turn down'." },
        { num: 7, verb: "End up", particle: "UP", meaning: "Terminar o acabar en un lugar o situación", example: "We took the wrong train and ended up in a different city.", tip: "Expresa el resultado final imprevisto de una cadena de hechos." },
        { num: 8, verb: "Catch up (with)", particle: "UP", meaning: "Ponerse al día / Alcanzar a alguien", example: "Let's have a coffee tomorrow to catch up on each other's news.", tip: "El phrasal verb social por excelencia entre amigos y colegas." },
        { num: 9, verb: "Back up", particle: "UP", meaning: "Respaldar con datos / Copia de seguridad", example: "Always back up your files before installing an update.", tip: "Tiene doble uso: tecnológico (backup) y argumentativo." },
        { num: 10, verb: "Wrap up", particle: "UP", meaning: "Concluir o rematar con éxito una reunión", example: "Let's wrap up this meeting in the next five minutes.", tip: "Metáfora de 'envolver un regalo' para darlo por finalizado." },
        { num: 11, verb: "Make up", particle: "UP", meaning: "Inventar una historia / Reconciliarse", example: "She made up an excuse for missing the morning class.", tip: "También significa maquillarse, según el contexto." },
        { num: 12, verb: "Cheer up", particle: "UP", meaning: "Animar / Ponerse de buen humor", example: "Cheer up! Tomorrow is a new day with new opportunities.", tip: "'Up' eleva el estado de ánimo hacia arriba." },
        { num: 13, verb: "Speed up", particle: "UP", meaning: "Acelerar / Aumentar la velocidad", example: "We need to speed up production to meet customer demand.", tip: "Antónimo: 'Slow down'." },
        { num: 14, verb: "Hold up", particle: "UP", meaning: "Retrasar / Sostener", example: "Traffic on the bridge held us up for over an hour.", tip: "En voz pasiva: 'I was held up in traffic' (me retrasé)." },
        { num: 15, verb: "Pick up", particle: "UP", meaning: "Recoger en coche / Aprender rápido de oído", example: "Children pick up languages much faster than adults.", tip: "'Pick up Spanish' = aprender español de oído y sobre la marcha." },
        { num: 16, verb: "Blow up", particle: "UP", meaning: "Explotar / Volverse viral de golpe", example: "The video blew up on social media overnight.", tip: "Muy usado en la era digital para contenidos virales." },
        { num: 17, verb: "Break up", particle: "UP", meaning: "Romper una relación / Cortarse el audio", example: "Your voice is breaking up, can you repeat that?", tip: "Esencial en videollamadas de Teams y Zoom cuando falla el audio." },
        { num: 18, verb: "Clean up", particle: "UP", meaning: "Limpiar a fondo / Ganar mucho dinero", example: "They cleaned up their office space before the audit.", tip: "'Up' añade la idea de limpieza integral y exhaustiva." },

        // OUT (19-35)
        { num: 19, verb: "Figure out", particle: "OUT", meaning: "Resolver, descifrar o comprender un problema", example: "I finally figured out how this complex software works.", tip: "El phrasal verb mental más usado para 'dar con la solución'." },
        { num: 20, verb: "Find out", particle: "OUT", meaning: "Enterarse o descubrir una información", example: "I found out about the exam date just yesterday.", tip: "Enterarse de un dato que no sabías previamente." },
        { num: 21, verb: "Run out of", particle: "OUT", meaning: "Quedarse sin existencias / Agotarse algo", example: "We have run out of coffee and milk in the office.", tip: "Estructura de 3 palabras clave: 'I ran out of time'." },
        { num: 22, verb: "Carry out", particle: "OUT", meaning: "Llevar a cabo o ejecutar (plan, estudio)", example: "The scientists carried out several experiments in the lab.", tip: "Vocabulario formal indispensable en exámenes B2/C1 y negocios." },
        { num: 23, verb: "Point out", particle: "OUT", meaning: "Señalar, indicar o hacer notar un hecho", example: "She pointed out that the calculations contained an error.", tip: "Poner el foco sobre un detalle que otros pasaron por alto." },
        { num: 24, verb: "Work out", particle: "OUT", meaning: "Hacer ejercicio físico / Funcionar bien un plan", example: "Don't worry, everything will work out fine in the end.", tip: "Doble sentido: gimnasio ('I work out') o solución ('it worked out')." },
        { num: 25, verb: "Check out", particle: "OUT", meaning: "Dejar un hotel / Echar un vistazo a algo", example: "You should definitely check out this new language app.", tip: "'Check it out!' = ¡Mira esto! / ¡Échale un ojo!" },
        { num: 26, verb: "Pass out", particle: "OUT", meaning: "Desmayarse / Perder el conocimiento", example: "It was so hot in the crowded room that he passed out.", tip: "Falso amigo: no significa pasar de curso (que es 'pass an exam')." },
        { num: 27, verb: "Stand out", particle: "OUT", meaning: "Destacar o sobresalir entre los demás", example: "Her exceptional fluency made her stand out from the other candidates.", tip: "'Stand out from the crowd' = destacar entre la multitud." },
        { num: 28, verb: "Burn out", particle: "OUT", meaning: "Agotarse física o mentalmente por estrés", example: "Working seventy hours a week caused him to burn out.", tip: "Origen del término psicológico moderno 'burnout laboral'." },
        { num: 29, verb: "Rule out", particle: "OUT", meaning: "Descartar una posibilidad o hipótesis", example: "The doctor ruled out any serious infection after testing.", tip: "Excluir algo del abanico de opciones." },
        { num: 30, verb: "Sort out", particle: "OUT", meaning: "Poner en orden, resolver o solucionar un lío", example: "We need to sort out these invoice discrepancies immediately.", tip: "Muy británico: 'Don't worry, I'll sort it out'." },
        { num: 31, verb: "Drop out (of)", particle: "OUT", meaning: "Abandonar los estudios o una carrera", example: "Steve Jobs famously dropped out of college after six months.", tip: "'Dropout' como sustantivo = persona que deja la universidad." },
        { num: 32, verb: "Turn out", particle: "OUT", meaning: "Resultar ser al final", example: "The difficult task turned out to be surprisingly easy.", tip: "'As it turns out...' = al final resultó que..." },
        { num: 33, verb: "Speak out", particle: "OUT", meaning: "Expresar la opinión públicamente con valentía", example: "She spoke out against unfair workplace practices.", tip: "'Out' añade el sentido de alzar la voz con coraje." },
        { num: 34, verb: "Wear out", particle: "OUT", meaning: "Desgastar por el uso / Dejar exhausto", example: "These running shoes are completely worn out after the marathon.", tip: "También se usa con personas: 'I am completely worn out'." },
        { num: 35, verb: "Watch out", particle: "OUT", meaning: "¡Cuidado! / Estar alerta ante un peligro", example: "Watch out for the wet floor, it's very slippery.", tip: "Interjección de advertencia inmediata: 'Watch out!'" },

        // OFF (36-50)
        { num: 36, verb: "Call off", particle: "OFF", meaning: "Cancelar definitivamente un evento o plan", example: "They called off the outdoor festival due to the thunderstorm.", tip: "Sinónimo directo y habitual de 'cancel'." },
        { num: 37, verb: "Put off", particle: "OFF", meaning: "Posponer o procrastinar / Desanimar", example: "Never put off until tomorrow what you can do today.", tip: "Diferencia con 'call off': 'put off' es aplazar; 'call off' es cancelar." },
        { num: 38, verb: "Take off", particle: "OFF", meaning: "Despegar un avión / Despegar un negocio", example: "The airplane took off smoothly despite the rain.", tip: "Si un negocio 'takes off', empieza a tener un éxito arrollador." },
        { num: 39, verb: "Turn off", particle: "OFF", meaning: "Apagar un aparato electrónico o luz", example: "Please turn off the lights when leaving the room.", tip: "Antónimo: 'Turn on'." },
        { num: 40, verb: "Pay off", particle: "OFF", meaning: "Dar frutos un esfuerzo / Liquidar una deuda", example: "All your hard study will definitely pay off in the exam.", tip: "'Hard work pays off' = el trabajo duro da sus frutos." },
        { num: 41, verb: "Lay off", particle: "OFF", meaning: "Despedir trabajadores por recorte", example: "The company had to lay off two hundred employees during the crisis.", tip: "'Lay off' es despido por causas económicas, no disciplinarias." },
        { num: 42, verb: "Set off", particle: "OFF", meaning: "Ponerse en camino / Activar una alarma", example: "We set off early in the morning to beat the rush hour traffic.", tip: "Iniciar un viaje o activar un mecanismo sensor." },
        { num: 43, verb: "Drop off", particle: "OFF", meaning: "Dejar a alguien en coche / Quedarse dormido", example: "I can drop you off at the station on my way to work.", tip: "Muy cotidiano para favores de transporte." },
        { num: 44, verb: "Cut off", particle: "OFF", meaning: "Cortar el suministro / Interrumpir una llamada", example: "We were suddenly cut off in the middle of our phone conversation.", tip: "Sensación de desconexión abrupta." },
        { num: 45, verb: "Pull off", particle: "OFF", meaning: "Lograr algo muy difícil contra todo pronóstico", example: "Nobody expected them to win, but they pulled it off.", tip: "Victoria heroica o logro inesperado: 'We pulled it off!'" },
        { num: 46, verb: "Break off", particle: "OFF", meaning: "Romper negociaciones o un compromiso", example: "The two countries broke off diplomatic relations yesterday.", tip: "Ruptura formal y definitiva." },
        { num: 47, verb: "Show off", particle: "OFF", meaning: "Presumir o alardear delante de otros", example: "He loves to show off his expensive sports car.", tip: "'Show-off' como sustantivo = un presumido / fantasma." },
        { num: 48, verb: "Tell off", particle: "OFF", meaning: "Echar una bronca o regañar con severidad", example: "The manager told him off for arriving late three days in a row.", tip: "Regañina verbal formal." },
        { num: 49, verb: "See off", particle: "OFF", meaning: "Despedir a alguien que se va de viaje", example: "All her friends went to the airport to see her off.", tip: "Acompañar a alguien al punto de partida para decirle adiós." },
        { num: 50, verb: "Hold off", particle: "OFF", meaning: "Esperar antes de tomar una decisión", example: "Let's hold off on making an offer until we see the audit.", tip: "Pausar conscientemente una acción." },

        // DOWN (51-65)
        { num: 51, verb: "Turn down", particle: "DOWN", meaning: "Rechazar una oferta / Bajar el volumen", example: "She turned down the prestigious job offer because of the salary.", tip: "'Turn down an offer' = declinar o rechazar una propuesta." },
        { num: 52, verb: "Calm down", particle: "DOWN", meaning: "Tranquilizarse / Calmar los nervios", example: "Take a deep breath and calm down before answering.", tip: "La partícula 'down' hace descender la agitación emocional." },
        { num: 53, verb: "Break down", particle: "DOWN", meaning: "Averiarse una máquina / Desglosar datos", example: "Our car broke down on the highway, so we called for assistance.", tip: "También se usa para desglosar: 'Let's break down the costs'." },
        { num: 54, verb: "Write down", particle: "DOWN", meaning: "Anotar o apuntar en un papel", example: "Write down his email address before you forget it.", tip: "Registrar por escrito para no olvidar." },
        { num: 55, verb: "Cut down on", particle: "DOWN", meaning: "Reducir el consumo de algo", example: "I am trying to cut down on sugar and processed foods.", tip: "Estructura de 3 palabras para hábitos y presupuestos." },
        { num: 56, verb: "Shut down", particle: "DOWN", meaning: "Cerrar definitivamente un negocio / Apagar PC", example: "The factory was forced to shut down after thirty years.", tip: "Cese definitivo o apagado total de sistemas." },
        { num: 57, verb: "Settle down", particle: "DOWN", meaning: "Establecerse o sentar la cabeza", example: "After years of traveling, they decided to settle down in Spain.", tip: "Echar raíces y llevar una vida más tranquila." },
        { num: 58, verb: "Let down", particle: "DOWN", meaning: "Decepcionar o defraudar a alguien", example: "I promised to help you, and I will not let you down.", tip: "Como sustantivo: 'What a letdown!' (¡Menuda decepción!)." },
        { num: 59, verb: "Slow down", particle: "DOWN", meaning: "Reducir la velocidad / Tomarse calma", example: "Slow down, you are driving way too fast for this road.", tip: "Antónimo de 'speed up'." },
        { num: 60, verb: "Track down", particle: "DOWN", meaning: "Localizar o rastrear algo difícil", example: "The detective managed to track down the missing witness.", tip: "Encontrar tras una búsqueda exhaustiva." },
        { num: 61, verb: "Look down on", particle: "DOWN", meaning: "Despreciar o mirar por encima del hombro", example: "She never looks down on anyone, regardless of their background.", tip: "Antónimo directo: 'Look up to' (admirar)." },
        { num: 62, verb: "Scale down", particle: "DOWN", meaning: "Reducir la escala o tamaño de un plan", example: "We had to scale down the event due to budget constraints.", tip: "Adaptar el proyecto a menores recursos." },
        { num: 63, verb: "Tone down", particle: "DOWN", meaning: "Suavizar el tono o moderar la fuerza", example: "He was advised to tone down his criticism in the report.", tip: "Hacer algo menos agresivo o chocante." },
        { num: 64, verb: "Narrow down", particle: "DOWN", meaning: "Reducir una lista a pocas opciones", example: "We narrowed down the candidates from fifty to the top three.", tip: "Filtrar hasta quedarse con los finalistas." },
        { num: 65, verb: "Pin down", particle: "DOWN", meaning: "Concretar fechas o compromisos exactos", example: "It's difficult to pin him down on a specific launch date.", tip: "Conseguir que alguien se comprometa con un dato concreto." },

        // ON (66-80)
        { num: 66, verb: "Carry on", particle: "ON", meaning: "Continuar adelante pese a dificultades", example: "Keep calm and carry on with your daily work.", tip: "La famosa frase británica 'Keep Calm and Carry On'." },
        { num: 67, verb: "Keep on", particle: "ON", meaning: "Seguir haciendo algo repetidamente", example: "If you keep on practicing, you will become fluent in no time.", tip: "Siempre va seguido de verbo en -ING." },
        { num: 68, verb: "Count on", particle: "ON", meaning: "Contar con alguien / Confiar en su apoyo", example: "You can always count on me whenever you need help.", tip: "Sinónimo directo de 'rely on'." },
        { num: 69, verb: "Get on (with)", particle: "ON", meaning: "Llevarse bien con alguien / Ponerse a faenar", example: "I get on really well with all my colleagues at the office.", tip: "En inglés británico: 'get on with someone'." },
        { num: 70, verb: "Hold on", particle: "ON", meaning: "Esperar un momento al teléfono", example: "Hold on a second, let me check the files for you.", tip: "Fórmula universal para pedir un instante de espera." },
        { num: 71, verb: "Take on", particle: "ON", meaning: "Asumir responsabilidades / Contratar", example: "She is ready to take on the role of team leader.", tip: "Asumir retos o incorporar empleados a la empresa." },
        { num: 72, verb: "Pass on", particle: "ON", meaning: "Transmitir un mensaje a terceros", example: "Please pass on my regards to your parents.", tip: "Hacer llegar una información a un tercero." },
        { num: 73, verb: "Rely on", particle: "ON", meaning: "Depender de o confiar en alguien", example: "Businesses rely on accurate data to make strategic decisions.", tip: "Régimen preposicional obligatorio: 'rely ON'." },
        { num: 74, verb: "Log on / Log in", particle: "ON", meaning: "Iniciar sesión en un sistema digital", example: "Log on to your student portal to view your grades.", tip: "El pan de cada día en el mundo digital." },
        { num: 75, verb: "Catch on", particle: "ON", meaning: "Ponerse de moda / Darse cuenta de algo", example: "The new fashion trend caught on very quickly among teenagers.", tip: "Hacerse popular o 'pillar el truco' de algo." },
        { num: 76, verb: "Cheer on", particle: "ON", meaning: "Animar y aclamar a un equipo o atleta", example: "Thousands of fans gathered to cheer on their national team.", tip: "Dar apoyo con gritos y aplausos." },
        { num: 77, verb: "Move on", particle: "ON", meaning: "Pasar página / Avanzar a la siguiente etapa", example: "It's time to move on from past mistakes and look forward.", tip: "Superar el pasado y continuar creciendo." },
        { num: 78, verb: "Take on", particle: "ON", meaning: "Enfrentarse a un competidor o desafío", example: "Our company is ready to take on the industry market leader.", tip: "Desafiar con determinación." },
        { num: 79, verb: "Go on", particle: "ON", meaning: "Ocurrir / Continuar hablando", example: "What is going on here? Why is everyone laughing?", tip: "'What's going on?' = ¿Qué está pasando?" },
        { num: 80, verb: "Urge on", particle: "ON", meaning: "Espolear a alguien hacia adelante", example: "The mentor urged the young founder on despite the setbacks.", tip: "Infundir ánimo para no detenerse." },

        // IN / INTO / BACK & 3-WORD PHRASAL VERBS (81-100)
        { num: 81, verb: "Run into", particle: "INTO", meaning: "Tropezar por casualidad con alguien", example: "I ran into my old university professor at the airport.", tip: "Encuentro fortuito sin haberlo planeado." },
        { num: 82, verb: "Hand in", particle: "IN", meaning: "Entregar un trabajo o dimisión en mano", example: "All students must hand in their essays before Friday noon.", tip: "'Hand in your notice' = presentar la dimisión." },
        { num: 83, verb: "Give in", particle: "IN", meaning: "Ceder ante la presión / Rendirse", example: "The government refused to give in to the protesters' demands.", tip: "Ceder tras mucha resistencia." },
        { num: 84, verb: "Check in", particle: "IN", meaning: "Facturar en aeropuerto o registrarse en hotel", example: "We should check in at least two hours before the flight.", tip: "Trámite inicial obligatorio de viaje." },
        { num: 85, verb: "Drop in", particle: "IN", meaning: "Visita breve e improvisada sin avisar", example: "Feel free to drop in whenever you are in the neighborhood.", tip: "Visita informal y cálida." },
        { num: 86, verb: "Fill in / Fill out", particle: "IN", meaning: "Rellenar un formulario con datos", example: "Please fill out this registration form with your details.", tip: "'Fill in' es más británico; 'Fill out' es más americano." },
        { num: 87, verb: "Blend in", particle: "IN", meaning: "Camuflarse o integrarse sin llamar atención", example: "Chameleons change color to blend in with their surroundings.", tip: "Mimetizarse con el entorno." },
        { num: 88, verb: "Look into", particle: "INTO", meaning: "Investigar a fondo un asunto", example: "Management promised to look into the technical complaints.", tip: "Examinar con lupa para averiguar la verdad." },
        { num: 89, verb: "Bump into", particle: "INTO", meaning: "Toparse de frente con alguien", example: "Guess who I bumped into at the grocery store today?", tip: "Sinónimo coloquial de 'run into'." },
        { num: 90, verb: "Get back to", particle: "BACK", meaning: "Volver a contactar con una respuesta", example: "I will check the inventory and get back to you by noon.", tip: "La promesa ejecutiva clásica: 'I'll get back to you'." },
        { num: 91, verb: "Look forward to", particle: "3-WORD", meaning: "Esperar con ilusión / Tener muchas ganas", example: "I am looking forward to our upcoming summer vacation.", tip: "Exige sustantivo o verbo en -ING: 'looking forward to SEEING you'." },
        { num: 92, verb: "Come up with", particle: "3-WORD", meaning: "Idear o proponer una solución brillante", example: "She came up with an ingenious solution to the problem.", tip: "Generar una idea de la nada: 'Who came up with this?'" },
        { num: 93, verb: "Put up with", particle: "3-WORD", meaning: "Tolerar o aguantar una situación molesta", example: "I can no longer put up with this constant noise.", tip: "Sinónimo exacto de 'tolerate'." },
        { num: 94, verb: "Get rid of", particle: "3-WORD", meaning: "Deshacerse de algo que estorba", example: "It's time to get rid of all these old broken papers.", tip: "Eliminar lo que no sirve." },
        { num: 95, verb: "Look up to", particle: "3-WORD", meaning: "Admirar y respetar profundamente a alguien", example: "Young athletes always look up to Olympic champions.", tip: "Mirar 'hacia arriba' con admiración moral." },
        { num: 96, verb: "Get away with", particle: "3-WORD", meaning: "Salir impune de una falta o trampa", example: "He thought he could get away with cheating on the exam.", tip: "Cometer una trampa sin ser descubierto." },
        { num: 97, verb: "Face up to", particle: "3-WORD", meaning: "Afrontar una realidad dura con valentía", example: "We must face up to the fact that our costs are too high.", tip: "Mirar a la realidad de frente sin esconderse." },
        { num: 98, verb: "Look down on", particle: "3-WORD", meaning: "Despreciar o mirar por encima del hombro", example: "A true leader never looks down on junior team members.", tip: "Antónimo de 'look up to'." },
        { num: 99, verb: "Stand up for", particle: "3-WORD", meaning: "Defender con coraje una causa o persona", example: "Always stand up for what you believe is right and fair.", tip: "No quedarse callado ante una injusticia." },
        { num: 100, verb: "Run out of", particle: "3-WORD", meaning: "Agotar las reservas de algo crucial", example: "Hurry up, we are running out of time before the deadline.", tip: "¡El phrasal verb de 3 palabras más repetido del idioma!" }
    ],

    // 3. DATA: HISTORIAS CORTAS PARA PRINCIPIANTES (NIVEL A1-A2) CON GLOSARIO Y COMPRENSIÓN
    getShortStories: function(langCode) {
        const code = (langCode || 'en').toLowerCase();
        
        return [
            {
                chapter: 1,
                title: "The Mysterious Letter in the Old Library",
                subtitle: "Capítulo 1: La Carta Misteriosa en la Biblioteca Antigua",
                text: `Daniel walked into the quiet city library on a rainy Tuesday afternoon. The smell of old paper and coffee always made him feel relaxed. He wanted to find a book about gardening because his balcony had only three small plants.\n\nHe walked down the long corridor toward the back shelves. On the bottom shelf, he noticed a large green book titled 'Secret Gardens of the City'. When Daniel opened the book, a small, folded envelope fell to the wooden floor.\n\nThe paper was yellow and delicate. On the front, someone had written in elegant cursive: 'To the person who loves quiet places'. Daniel looked around, but the library was almost empty. With curiosity, he opened the envelope. Inside was a hand-drawn map of the historic neighborhood and a short note: 'Walk past the clock tower, turn left at the bakery, and knock three times on the blue wooden door.'\n\nDaniel smiled. His quiet Tuesday afternoon was about to become an unexpected adventure.`,
                glossary: [
                    { word: "shelves (shelf)", ipa: "/ʃɛlvz/", spanish: "estanterías", note: "Plural irregular: la 'f' cambia a 'ves'." },
                    { word: "folded envelope", ipa: "/ˈfoʊldəd ˈɛnvəˌloʊp/", spanish: "sobre doblado", note: "'Fold' es doblar papel o ropa." },
                    { word: "hand-drawn map", ipa: "/hænd-drɔn mæp/", spanish: "mapa dibujado a mano", note: "Participio irregular de 'draw'." },
                    { word: "knock", ipa: "/nɑk/", spanish: "llamar a la puerta / golpear", note: "La 'k' inicial es completamente muda." },
                    { word: "wooden floor", ipa: "/ˈwʊdən flɔr/", spanish: "suelo de madera", note: "Adjetivo de materia derivado de 'wood'." }
                ],
                questions: [
                    {
                        q: "¿Por qué fue Daniel a la biblioteca esa tarde lluviosa?",
                        options: ["A) A estudiar para un examen de historia", "B) A buscar un libro sobre jardinería para su balcón", "C) A resguardarse de la lluvia y tomar café"],
                        correct: 1,
                        explanation: "El texto especifica: 'He wanted to find a book about gardening because his balcony had only three small plants'."
                    },
                    {
                        q: "¿Qué cayó al suelo cuando abrió el libro verde?",
                        options: ["A) Una fotografía antigua", "B) Un sobre doblado de papel amarillo", "C) Una llave de bronce"],
                        correct: 1,
                        explanation: "Cayó un pequeño sobre amarillento con una nota y un mapa dibujado a mano."
                    },
                    {
                        q: "¿Qué indicaban las instrucciones de la carta?",
                        options: ["A) Pasar la torre del reloj y llamar 3 veces en la puerta azul", "B) Encontrarse con un anciano en la cafetería", "C) Devolver el libro antes de las cinco"],
                        correct: 0,
                        explanation: "La nota decía: 'Walk past the clock tower, turn left at the bakery, and knock three times on the blue wooden door'."
                    }
                ]
            },
            {
                chapter: 2,
                title: "A Weekend in the Mountain Cottage",
                subtitle: "Capítulo 2: Un Fin de Semana en la Cabaña de Montaña",
                text: `Last autumn, Elena and her brother Marco decided to escape the busy city for three days. They packed warm sweaters, hiking boots, and a basket of fresh food from the local market. Their grandfather had a small wooden cottage near the pine forest.\n\nWhen they arrived, the air was crisp and smelled of autumn leaves and woodsmoke. There was no internet connection and no television, only a fireplace and a large table near the window. In the evening, while the wind blew outside, they cooked vegetable soup and baked fresh bread together.\n\n'Do you remember when grandfather taught us how to identify animal footprints?' asked Marco with a laugh. They spent the night talking about childhood memories and planning their morning hike to the mountain lake. Elena realized that stepping away from screens had given her more peace than anything else in months.`,
                glossary: [
                    { word: "cottage", ipa: "/ˈkɑtɪʤ/", spanish: "cabaña / casita de campo", note: "Típica vivienda rural rústica." },
                    { word: "crisp air", ipa: "/krɪsp ɛr/", spanish: "aire fresco y tonificante", note: "Describe aire limpio, fresco y frío." },
                    { word: "fireplace", ipa: "/ˈfaɪərˌpleɪs/", spanish: "chimenea de leña", note: "Compuesto de 'fire' + 'place'." },
                    { word: "footprints", ipa: "/ˈfʊtˌprɪnts/", spanish: "huellas de pisadas", note: "Compuesto de 'foot' + 'print'." },
                    { word: "hiking boots", ipa: "/ˈhaɪkɪŋ buts/", spanish: "botas de senderismo", note: "'Hike' es caminar por montaña." }
                ],
                questions: [
                    {
                        q: "¿Qué llevaron Elena y Marco para su estancia en la cabaña?",
                        options: ["A) Ordenadores portátiles y libros de trabajo", "B) Jerséis de abrigo, botas de montaña y comida fresca", "C) Tiendas de campaña y sacos de dormir"],
                        correct: 1,
                        explanation: "Empacaron ropa de abrigo, botas de senderismo y una cesta de comida de mercado."
                    },
                    {
                        q: "¿Qué hicieron durante la tarde en la cabaña?",
                        options: ["A) Vieron películas en la televisión", "B) Cocinaron sopa de verduras y hornearon pan junto al fuego", "C) Se fueron a dormir temprano por el frío"],
                        correct: 1,
                        explanation: "Cocinaron juntos sopa caliente y pan mientras el viento soplaba afuera."
                    },
                    {
                        q: "¿Qué valiosa lección descubrió Elena?",
                        options: ["A) Que la ciudad es mucho más cómoda", "B) Que desconectar de las pantallas le dio una paz inigualable", "C) Que las mañanas de otoño son demasiado frías"],
                        correct: 1,
                        explanation: "'Elena realized that stepping away from screens had given her more peace than anything else in months'."
                    }
                ]
            },
            {
                chapter: 3,
                title: "The Bakery Secret in the Old Town",
                subtitle: "Capítulo 3: El Secreto de la Panadería del Casco Antiguo",
                text: `Every morning at five o'clock, Lucas walked through the cobbled streets of the old quarter. While the rest of the town was still sleeping, a warm golden light shone from the basement window of 'La Petite Brioche'. Mr. Bernard, the master baker, had been baking bread there for more than forty years.\n\nLucas was learning the craft. His favorite part of the day was working the sourdough. Mr. Bernard always said: 'Patience is the secret ingredient. You cannot hurry bread, just like you cannot hurry learning a new language. You must give it time to breathe.'\n\nThat morning, an international food critic entered the shop unexpectedly. She tasted a simple butter croissant and closed her eyes in surprise. 'What is the secret to this flaky texture?' she asked. Mr. Bernard smiled warmly at Lucas and answered: 'Good flour, cold butter, and respect for time.'`,
                glossary: [
                    { word: "cobbled streets", ipa: "/ˈkɑbəld strits/", spanish: "calles adoquinadas", note: "Típico del centro histórico europeo." },
                    { word: "sourdough", ipa: "/ˈsaʊərˌdoʊ/", spanish: "masa madre", note: "Literalmente 'masa ácida/fermentada'." },
                    { word: "flaky texture", ipa: "/ˈfleɪki ˈtɛksʧər/", spanish: "textura hojaldrada y crujiente", note: "Describe las capas ligeras del hojaldre." },
                    { word: "craft", ipa: "/kræft/", spanish: "oficio artesanal / destreza", note: "Oficio que requiere maestría manual." }
                ],
                questions: [
                    {
                        q: "¿A qué hora empezaba Lucas su jornada en la panadería?",
                        options: ["A) A las siete de la mañana", "B) A las cinco de la madrugada", "C) A las ocho con los primeros clientes"],
                        correct: 1,
                        explanation: "El relato inicia: 'Every morning at five o'clock, Lucas walked through the cobbled streets'."
                    },
                    {
                        q: "¿Con qué comparaba el Sr. Bernard el proceso del pan?",
                        options: ["A) Con una carrera de velocidad", "B) Con aprender un nuevo idioma con paciencia y tiempo", "C) Con un negocio financiero"],
                        correct: 1,
                        explanation: "'You cannot hurry bread, just like you cannot hurry learning a new language'."
                    }
                ]
            }
        ];
    },

    // 4. DATA: LIBRO DE TEXTO PARALELO (DUAL-LANGUAGE BOOK) EN COLUMNAS PARALELAS
    getDualLanguageBook: function(langCode) {
        return {
            title: "The Journey of Two Friends Across the World",
            titleSpanish: "El Viaje de Dos Amigos Alrededor del Mundo",
            subtitle: "Lectura Bilingüe en Columnas Paralelas · Sin Necesidad de Diccionario",
            paragraphs: [
                {
                    pNum: 1,
                    original: "The sun was rising slowly over the harbor when Clara and Julian boarded the ferry. A light morning breeze carried the salty scent of the ocean and the distant cry of seagulls. It was the first day of an eight-month voyage across four continents, and their backpacks carried only the essentials.",
                    spanish: "El sol se elevaba lentamente sobre el puerto cuando Clara y Julián subieron a bordo del transbordador. Una ligera brisa matutina traía el aroma salado del océano y el grito lejano de las gaviotas. Era el primer día de una travesía de ocho meses por cuatro continentes, y en sus mochilas llevaban únicamente lo indispensable."
                },
                {
                    pNum: 2,
                    original: "For two years, they had saved every single penny from their part-time jobs. Their friends thought they were crazy to leave their comfortable routines, but Clara believed that true education begins when you step outside your familiar comfort zone.",
                    spanish: "Durante dos años, habían ahorrado hasta el último céntimo de sus empleos a tiempo parcial. Sus amigos pensaban que estaban locos por dejar atrás sus cómodas rutinas, pero Clara creía firmemente que la verdadera educación comienza cuando das un paso fuera de tu zona de confort habitual."
                },
                {
                    pNum: 3,
                    original: "Their first destination was a quiet coastal village surrounded by steep limestone cliffs. The locals spoke a dialect that sounded like a song, and nobody seemed to be in a hurry. Time moved at the pace of the tides, measured not by clocks, but by shared meals and afternoon conversations.",
                    spanish: "Su primer destino fue un tranquilo pueblo costero rodeado de escarpados acantilados de piedra caliza. Los lugareños hablaban un dialecto que sonaba como una melodía, y nadie parecía tener prisa. El tiempo avanzaba al ritmo de las mareas, medido no por relojes, sino por comidas compartidas y conversaciones al atardecer."
                },
                {
                    pNum: 4,
                    original: "Julian was initially nervous about making mistakes when speaking with the local shopkeepers. However, he soon discovered that people appreciated his genuine effort much more than grammatical perfection. A warm smile and a polite greeting unlocked more doors than any textbook ever could.",
                    spanish: "Al principio, Julián estaba nervioso por cometer errores al hablar con los tenderos locales. Sin embargo, pronto descubrió que la gente apreciaba su esfuerzo sincero mucho más que la perfección gramatical. Una sonrisa cálida y un saludo cortés abrían más puertas que cualquier libro de texto."
                },
                {
                    pNum: 5,
                    original: "One evening, an elderly fisherman named Mateo invited them to share freshly grilled sardines on the stone pier. As the sky turned deep shades of violet and amber, Mateo told stories of storms he had survived and constellations that guided ships through dark waters.",
                    spanish: "Una tarde, un anciano pescador llamado Mateo los invitó a compartir sardinas recién asadas sobre el muelle de piedra. Mientras el cielo se teñía de tonos violáceos y ámbar, Mateo les contó historias de tempestades a las que había sobrevivido y de constelaciones que guiaban a los barcos por aguas oscuras."
                },
                {
                    pNum: 6,
                    original: "'The sea teaches you humility,' Mateo said quietly, looking at the horizon. 'It reminds you that you are small, but it also shows you that you are connected to every other shore on earth.' Those words stayed with Clara and Julian for the rest of their journey.",
                    spanish: "'El mar te enseña humildad', dijo Mateo en voz baja, mirando al horizonte. 'Te recuerda lo pequeño que eres, pero también te demuestra que estás conectado con todas las demás costas de la tierra'. Aquellas palabras acompañaron a Clara y Julián durante el resto de su viaje."
                },
                {
                    pNum: 7,
                    original: "Months passed like chapters in an unforgettable novel. They crossed desert dunes on camels, navigated bustling night markets in tropical capitals, and climbed snow-capped mountains at dawn. Along the way, their language skills grew naturally, rooted in genuine human connection.",
                    spanish: "Los meses transcurrieron como capítulos de una novela inolvidable. Cruzaron dunas del desierto a lomos de camellos, recorrieron bulliciosos mercados nocturnos en capitales tropicales y coronaron montañas nevadas al amanecer. Por el camino, su soltura con el idioma creció de forma natural, enraizada en la conexión humana auténtica."
                },
                {
                    pNum: 8,
                    original: "When they finally returned home, their backpacks were worn and their boots covered in dust from a dozen countries. Yet the greatest change was invisible: they no longer saw the world as a collection of foreign places, but as a vast, welcoming neighborhood waiting to be understood.",
                    spanish: "Cuando por fin regresaron a casa, sus mochilas estaban gastadas y sus botas cubiertas del polvo de una docena de países. Sin embargo, el mayor cambio era invisible: ya no veían el mundo como una colección de lugares extraños, sino como un inmenso y acogedor vecindario a la espera de ser comprendido."
                }
            ]
        };
    },

    // MÉTODO MAESTRO 1: DESCARGA DIRECTA DE PDF MEDIANTE JSPDF
    downloadPDF: function(type) {
        let isBusiness = (type === 'business' || type === 'negocios');
        let isPhrasal = (type === 'phrasal_verbs' || type === 'phrasal');
        let isStories = (type === 'short_stories' || type === 'historias');
        let isDual = (type === 'dual_language' || type === 'paralelo');

        let title = "JETBULARY EBOOK OFICIAL";
        let subtitle = "Guía Exclusiva de Aprendizaje";
        let filename = "Jetbulary_Ebook.pdf";

        if (isBusiness) {
            title = "LAS 100 FRASES MÁS USADAS EN ENTORNOS DE NEGOCIOS";
            subtitle = "Manual Ejecutivo de Inglés Corporativo para Profesionales";
            filename = "Jetbulary_Ebook_100_Frases_Negocios.pdf";
        } else if (isPhrasal) {
            title = "GUÍA DEFINITIVA DE PHRASAL VERBS";
            subtitle = "Los 100 Phrasal Verbs Esenciales Organizados por Partículas y Fórmulas";
            filename = "Jetbulary_Ebook_Guia_Definitiva_Phrasal_Verbs.pdf";
        } else if (isStories) {
            title = "HISTORIAS CORTAS PARA PRINCIPIANTES (NIVEL A1-A2)";
            subtitle = "Relatos Graduados con Glosario de Términos y Preguntas de Comprensión";
            filename = "Jetbulary_Ebook_Historias_Cortas_A1_A2.pdf";
        } else if (isDual) {
            title = "LIBRO DE TEXTO PARALELO (DUAL-LANGUAGE BOOK)";
            subtitle = "Lectura Inmersiva en Columnas Paralelas sin Necesidad de Diccionario";
            filename = "Jetbulary_Ebook_Texto_Paralelo_Bilingue.pdf";
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            ebooks.openPrintView(type);
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 14;
            const contentWidth = pageWidth - (margin * 2);
            let y = 16;

            const checkPageBreak = (neededHeight) => {
                if (y + neededHeight > pageHeight - 16) {
                    doc.addPage();
                    y = 16;
                    doc.setFillColor(15, 23, 42);
                    doc.rect(margin, y, contentWidth, 7, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7.5);
                    doc.setTextColor(0, 243, 255);
                    doc.text(`JETBULARY · ${title.substring(0, 50)}...`, margin + 3, y + 4.8);
                    y += 11;
                }
            };

            // --- PORTADA EJECUTIVA MAQUETADA ---
            doc.setFillColor(10, 15, 28);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            doc.setDrawColor(0, 243, 255);
            doc.setLineWidth(1);
            doc.roundedRect(margin, margin, contentWidth, pageHeight - (margin * 2), 4, 4, 'D');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(0, 243, 255);
            doc.text("JETBULARY", pageWidth / 2, 45, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(148, 163, 184);
            doc.text("ACADEMIA DE IDIOMAS & FLUIDEZ IA", pageWidth / 2, 53, { align: 'center' });

            doc.setDrawColor(0, 243, 255);
            doc.setLineWidth(0.5);
            doc.line(pageWidth / 2 - 35, 60, pageWidth / 2 + 35, 60);

            doc.setFillColor(0, 243, 255);
            doc.roundedRect(pageWidth / 2 - 40, 75, 80, 8, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(10, 15, 28);
            doc.text("EDICIÓN EXCLUSIVA DE APRENDIZAJE", pageWidth / 2, 80.5, { align: 'center' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            const titleSplit = doc.splitTextToSize(title, contentWidth - 20);
            let titleY = 100;
            titleSplit.forEach(l => {
                doc.text(l, pageWidth / 2, titleY, { align: 'center' });
                titleY += 8;
            });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(203, 213, 225);
            const subSplit = doc.splitTextToSize(subtitle, contentWidth - 26);
            let subY = titleY + 4;
            subSplit.forEach(l => {
                doc.text(l, pageWidth / 2, subY, { align: 'center' });
                subY += 5.5;
            });

            // Recuadro de características
            doc.setFillColor(15, 23, 42);
            doc.roundedRect(margin + 10, subY + 12, contentWidth - 20, 52, 3, 3, 'F');
            doc.setDrawColor(30, 41, 59);
            doc.roundedRect(margin + 10, subY + 12, contentWidth - 20, 52, 3, 3, 'D');

            let boxTextY = subY + 22;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(0, 243, 255);
            doc.text("CARACTERÍSTICAS DE ESTE EBOOK:", margin + 16, boxTextY);
            boxTextY += 7;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(226, 232, 240);
            if (isBusiness) {
                doc.text("• 100 frases ejecutivas organizadas en 6 situaciones corporativas reales.", margin + 16, boxTextY); boxTextY += 6;
                doc.text("• Transcripción fonética IPA y traducción fiel para hispanohablantes.", margin + 16, boxTextY); boxTextY += 6;
                doc.text("• Tips estratégicos de negociación, diplomacia y presentaciones.", margin + 16, boxTextY);
            } else if (isPhrasal) {
                doc.text("• 100 phrasal verbs ordenados por familias de partículas (UP, OUT, OFF, DOWN, ON).", margin + 16, boxTextY); boxTextY += 6;
                doc.text("• Trucos nemotécnicos para deducir el significado sin memorizar a ciegas.", margin + 16, boxTextY); boxTextY += 6;
                doc.text("• Ejemplos prácticos y sección de verbos compuestos de 3 palabras.", margin + 16, boxTextY);
            } else if (isStories) {
                doc.text("• 3 relatos amenos graduados a nivel A1-A2 con gramática y vocabulario real.", margin + 16, boxTextY); boxTextY += 6;
                doc.text("• Glosario de términos clave al final de cada capítulo con notas fonéticas.", margin + 16, boxTextY); boxTextY += 6;
                doc.text("• Preguntas de comprensión lectora con soluciones explicadas.", margin + 16, boxTextY);
            } else {
                doc.text("• Relato inmersivo maquetado en columnas paralelas (Texto original vs Español).", margin + 16, boxTextY); boxTextY += 6;
                doc.text("• Lectura continua y fluida sin necesidad de acudir al diccionario.", margin + 16, boxTextY); boxTextY += 6;
                doc.text("• Asimilación intuitiva de estructuras oracionales y riqueza léxica.", margin + 16, boxTextY);
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text("Publicado por Jetbulary · www.jetbulary.com · Licencia de Formación Personal", pageWidth / 2, pageHeight - 22, { align: 'center' });

            // --- CONTENIDO DEL EBOOK ---
            doc.addPage();
            y = 16;

            if (isBusiness) {
                let currentCat = '';
                ebooks.businessPhrases.forEach((item) => {
                    if (item.category !== currentCat) {
                        currentCat = item.category;
                        checkPageBreak(16);
                        doc.setFillColor(15, 23, 42);
                        doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(9);
                        doc.setTextColor(0, 243, 255);
                        doc.text(`BLOQUE: ${currentCat.toUpperCase()}`, margin + 4, y + 5.5);
                        y += 11;
                    }
                    checkPageBreak(22);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8.8);
                    doc.setTextColor(15, 23, 42);
                    doc.text(`${item.num}. ${item.phrase}`, margin + 2, y + 4);
                    y += 7.5;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.2);
                    doc.setTextColor(100, 116, 139);
                    doc.text(`IPA: ${item.ipa}`, margin + 6, y + 2);
                    y += 5;

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7.8);
                    doc.setTextColor(13, 148, 136);
                    doc.text(`Español: "${item.spanish}"`, margin + 6, y + 2);
                    y += 5;

                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(7.2);
                    doc.setTextColor(71, 85, 105);
                    const tipLines = doc.splitTextToSize(`Tip: ${item.tip}`, contentWidth - 10);
                    tipLines.forEach(l => { doc.text(l, margin + 6, y + 2); y += 3.8; });
                    y += 3;

                    doc.setDrawColor(226, 232, 240);
                    doc.line(margin + 4, y, margin + contentWidth - 4, y);
                    y += 3.5;
                });
            } else if (isPhrasal) {
                let currentCat = '';
                ebooks.phrasalVerbs.forEach((item) => {
                    if (item.particle !== currentCat) {
                        currentCat = item.particle;
                        checkPageBreak(16);
                        doc.setFillColor(15, 23, 42);
                        doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(9);
                        doc.setTextColor(0, 243, 255);
                        doc.text(`PARTÍCULA: "${currentCat.toUpperCase()}"`, margin + 4, y + 5.5);
                        y += 11;
                    }
                    checkPageBreak(22);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    doc.setTextColor(15, 23, 42);
                    doc.text(`${item.num}. ${item.verb}  [${item.particle}]`, margin + 2, y + 4);
                    y += 7.5;

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7.8);
                    doc.setTextColor(13, 148, 136);
                    doc.text(`Significado: ${item.meaning}`, margin + 6, y + 2);
                    y += 5;

                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(7.6);
                    doc.setTextColor(3, 105, 161);
                    const exLines = doc.splitTextToSize(`Ejemplo: "${item.example}"`, contentWidth - 10);
                    exLines.forEach(l => { doc.text(l, margin + 6, y + 2); y += 3.8; });

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.2);
                    doc.setTextColor(71, 85, 105);
                    const tipLines = doc.splitTextToSize(`Truco: ${item.tip}`, contentWidth - 10);
                    tipLines.forEach(l => { doc.text(l, margin + 6, y + 2); y += 3.8; });
                    y += 3;

                    doc.setDrawColor(226, 232, 240);
                    doc.line(margin + 4, y, margin + contentWidth - 4, y);
                    y += 3.5;
                });
            } else if (isStories) {
                const stories = ebooks.getShortStories(currentLang);
                stories.forEach((st) => {
                    checkPageBreak(24);
                    doc.setFillColor(15, 23, 42);
                    doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, 'F');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9.5);
                    doc.setTextColor(0, 243, 255);
                    doc.text(st.title.toUpperCase(), margin + 4, y + 6);
                    y += 13;

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8.2);
                    doc.setTextColor(30, 41, 59);
                    const pSplit = doc.splitTextToSize(st.text, contentWidth - 6);
                    pSplit.forEach(l => {
                        checkPageBreak(4.5);
                        doc.text(l, margin + 3, y);
                        y += 4.2;
                    });
                    y += 6;

                    // Glosario
                    checkPageBreak(18);
                    doc.setFillColor(240, 253, 250);
                    doc.setDrawColor(13, 148, 136);
                    doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'FD');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(13, 148, 136);
                    doc.text("GLOSARIO DE TÉRMINOS CLAVE", margin + 4, y + 4.8);
                    y += 10;

                    st.glossary.forEach(g => {
                        checkPageBreak(8);
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(7.8);
                        doc.setTextColor(15, 23, 42);
                        doc.text(`• ${g.word} [${g.ipa}]: `, margin + 4, y);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(71, 85, 105);
                        doc.text(`${g.spanish} (${g.note})`, margin + 45, y);
                        y += 4.5;
                    });
                    y += 4;

                    // Preguntas
                    checkPageBreak(16);
                    doc.setFillColor(254, 242, 242);
                    doc.setDrawColor(239, 68, 68);
                    doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'FD');
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                    doc.setTextColor(185, 28, 28);
                    doc.text("PREGUNTAS DE COMPRENSIÓN LECTORA", margin + 4, y + 4.8);
                    y += 10;

                    st.questions.forEach((q, qIdx) => {
                        checkPageBreak(16);
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(7.8);
                        doc.setTextColor(15, 23, 42);
                        doc.text(`${qIdx + 1}. ${q.q}`, margin + 4, y);
                        y += 4.5;
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(7.2);
                        doc.setTextColor(71, 85, 105);
                        q.options.forEach(opt => {
                            doc.text(`   ${opt}`, margin + 4, y);
                            y += 3.8;
                        });
                        doc.setFont('helvetica', 'italic');
                        doc.setTextColor(13, 148, 136);
                        doc.text(`   ✓ Solución explicada: ${q.explanation}`, margin + 4, y);
                        y += 5;
                    });
                    y += 6;
                });
            } else if (isDual) {
                const book = ebooks.getDualLanguageBook(currentLang);
                const colWidth = (contentWidth - 6) / 2;

                checkPageBreak(16);
                doc.setFillColor(15, 23, 42);
                doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(0, 243, 255);
                doc.text(book.title.toUpperCase(), margin + 4, y + 5.5);
                y += 12;

                book.paragraphs.forEach(p => {
                    const origLines = doc.splitTextToSize(p.original, colWidth - 4);
                    const spanLines = doc.splitTextToSize(p.spanish, colWidth - 4);
                    const maxHeight = Math.max(origLines.length, spanLines.length) * 4.2 + 6;

                    checkPageBreak(maxHeight);

                    // Caja paralela
                    doc.setFillColor(248, 250, 252);
                    doc.setDrawColor(226, 232, 240);
                    doc.roundedRect(margin, y, contentWidth, maxHeight, 1.5, 1.5, 'FD');

                    // Columna Original (Izquierda)
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7.6);
                    doc.setTextColor(3, 105, 161);
                    doc.text(`Párrafo #${p.pNum} [Original]`, margin + 3, y + 4.5);

                    let origY = y + 8.5;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.4);
                    doc.setTextColor(15, 23, 42);
                    origLines.forEach(l => { doc.text(l, margin + 3, origY); origY += 4; });

                    // Línea central divisoria
                    doc.setDrawColor(203, 213, 225);
                    doc.line(margin + colWidth + 3, y + 2, margin + colWidth + 3, y + maxHeight - 2);

                    // Columna Española (Derecha)
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7.6);
                    doc.setTextColor(13, 148, 136);
                    doc.text(`Párrafo #${p.pNum} [Español]`, margin + colWidth + 6, y + 4.5);

                    let spanY = y + 8.5;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.4);
                    doc.setTextColor(51, 65, 85);
                    spanLines.forEach(l => { doc.text(l, margin + colWidth + 6, spanY); spanY += 4; });

                    y += maxHeight + 4;
                });
            }

            // Pie de página con numeración
            const totalPages = (typeof doc.getNumberOfPages === 'function') ? doc.getNumberOfPages() : (doc.internal && typeof doc.internal.getNumberOfPages === 'function' ? doc.internal.getNumberOfPages() : (doc.internal?.pages ? doc.internal.pages.length - 1 : 1));
            for (let i = 2; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.2);
                doc.setTextColor(148, 163, 184);
                doc.text(`Jetbulary · ${title.substring(0, 45)} · Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 6.5, { align: 'center' });
            }

            doc.save(filename);
            if (typeof audio !== 'undefined' && audio.celebrate) audio.celebrate();
            alert(`✅ Ebook PDF descargado con éxito:\n${filename}\n\n¡Ábrelo en tu visor de PDF favorito para estudiar!`);

        } catch (err) {
            console.error("Error generando ebook jsPDF:", err);
            ebooks.openPrintView(type);
        }
    },

    // MÉTODO MAESTRO 2: VISTA IMPRIMIBLE / GUARDAR COMO PDF EN ALTA CALIDAD
    openPrintView: function(type) {
        let isBusiness = (type === 'business' || type === 'negocios');
        let isPhrasal = (type === 'phrasal_verbs' || type === 'phrasal');
        let isStories = (type === 'short_stories' || type === 'historias');
        let isDual = (type === 'dual_language' || type === 'paralelo');

        let title = "JETBULARY EBOOK OFICIAL";
        let subtitle = "Guía Exclusiva de Aprendizaje";

        if (isBusiness) {
            title = "LAS 100 FRASES MÁS USADAS EN ENTORNOS DE NEGOCIOS";
            subtitle = "Manual Ejecutivo de Inglés Corporativo para Profesionales";
        } else if (isPhrasal) {
            title = "GUÍA DEFINITIVA DE PHRASAL VERBS";
            subtitle = "Los 100 Phrasal Verbs Esenciales Organizados por Partículas y Fórmulas";
        } else if (isStories) {
            title = "HISTORIAS CORTAS PARA PRINCIPIANTES (NIVEL A1-A2)";
            subtitle = "Relatos Graduados con Glosario de Términos y Preguntas de Comprensión";
        } else if (isDual) {
            title = "LIBRO DE TEXTO PARALELO (DUAL-LANGUAGE BOOK)";
            subtitle = "Lectura Inmersiva en Columnas Paralelas sin Necesidad de Diccionario";
        }

        const printWin = window.open('', '_blank');
        if (!printWin) {
            alert("Por favor habilita las ventanas emergentes para visualizar el Ebook.");
            return;
        }

        let mainContentHtml = '';

        if (isBusiness) {
            let currentCat = '';
            ebooks.businessPhrases.forEach(item => {
                if (item.category !== currentCat) {
                    currentCat = item.category;
                    mainContentHtml += `<div class="category-header">📂 BLOQUE: ${currentCat.toUpperCase()}</div>`;
                }
                mainContentHtml += `
                    <div class="item-card">
                        <div class="item-title" style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span class="badge-num">#${item.num}</span>
                                <strong>${item.phrase}</strong>
                            </div>
                            <button class="no-print btn-speaker" onclick="speakText('${encodeURIComponent(item.phrase)}')" title="Escuchar pronunciación nativa de la profesora">🔊 Escuchar</button>
                        </div>
                        <div class="item-ipa">🗣️ ${item.ipa}</div>
                        <div class="item-spanish">🇪🇸 "${item.spanish}"</div>
                        <div class="item-tip">💡 <strong>Tip Ejecutivo:</strong> ${item.tip}</div>
                    </div>
                `;
            });
        } else if (isPhrasal) {
            let currentCat = '';
            ebooks.phrasalVerbs.forEach(item => {
                if (item.particle !== currentCat) {
                    currentCat = item.particle;
                    mainContentHtml += `<div class="category-header">⚡ FAMILIA DE PARTÍCULA: "${currentCat.toUpperCase()}"</div>`;
                }
                mainContentHtml += `
                    <div class="item-card">
                        <div class="item-title" style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span class="badge-num">#${item.num}</span>
                                <strong>${item.verb}</strong>
                                <span class="badge-particle">${item.particle}</span>
                            </div>
                            <div class="no-print" style="display: flex; gap: 6px;">
                                <button class="btn-speaker" onclick="speakText('${encodeURIComponent(item.verb)}')" title="Pronunciar verbo">🔊 Verbo</button>
                                <button class="btn-speaker" onclick="speakText('${encodeURIComponent(item.example)}')" title="Pronunciar frase completa">🔊 Frase</button>
                            </div>
                        </div>
                        <div class="item-spanish">🎯 <strong>Significado:</strong> ${item.meaning}</div>
                        <div class="item-example">💬 <strong>Ejemplo:</strong> "${item.example}"</div>
                        <div class="item-tip">⚡ <strong>Truco Nemotécnico:</strong> ${item.tip}</div>
                    </div>
                `;
            });
        } else if (isStories) {
            const stories = ebooks.getShortStories(currentLang);
            stories.forEach(st => {
                mainContentHtml += `
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px; margin-bottom: 25px; page-break-inside: avoid;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div>
                                <h2 style="color: #0f172a; margin: 0; font-size: 1.25rem;">📖 ${st.title}</h2>
                                <div style="color: #0284c7; font-size: 0.9rem; font-weight: bold; margin-top: 2px;">${st.subtitle}</div>
                            </div>
                            <button class="no-print btn-speaker" style="padding: 6px 14px; font-size: 0.88rem;" onclick="speakText('${encodeURIComponent(st.text)}')" title="Escuchar capítulo completo con la profesora">🔊 Escuchar Capítulo</button>
                        </div>
                        <div style="font-size: 0.94rem; color: #334155; line-height: 1.6; white-space: pre-line; background: #f8fafc; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #00f3ff;">
                            ${st.text}
                        </div>

                        <div style="margin-top: 18px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 14px;">
                            <strong style="color: #166534; font-size: 0.92rem;">📚 GLOSARIO DE TÉRMINOS CLAVE:</strong>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-top: 10px;">
                                ${st.glossary.map(g => `
                                    <div style="font-size: 0.82rem; background: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #bbf7d0;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <strong style="color: #0f172a;">${g.word}</strong>
                                            <button class="no-print btn-speaker" style="padding: 1px 6px; font-size: 0.72rem;" onclick="speakText('${encodeURIComponent(g.word)}')" title="Pronunciar palabra">🔊</button>
                                        </div>
                                        <span style="color: #64748b;">[${g.ipa}]</span><br>
                                        <span style="color: #15803d; font-weight: 600;">🇪🇸 ${g.spanish}</span><br>
                                        <span style="font-size: 0.76rem; color: #475569;">💡 ${g.note}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div style="margin-top: 18px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 14px;">
                            <strong style="color: #991b1b; font-size: 0.92rem;">❓ PREGUNTAS DE COMPRENSIÓN LECTORA:</strong>
                            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                                ${st.questions.map((q, idx) => `
                                    <div style="font-size: 0.84rem; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #fecaca;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <strong>${idx + 1}. ${q.q}</strong>
                                            <button class="no-print btn-speaker" style="padding: 1px 6px; font-size: 0.72rem;" onclick="speakText('${encodeURIComponent(q.q)}')" title="Pronunciar pregunta">🔊</button>
                                        </div>
                                        <div style="margin: 6px 0; color: #475569;">
                                            ${q.options.map(opt => `<div>• ${opt}</div>`).join('')}
                                        </div>
                                        <div style="font-size: 0.78rem; color: #047857; font-style: italic; background: #ecfdf5; padding: 4px 8px; border-radius: 4px;">
                                            ✓ Solución explicada: ${q.explanation}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            });
        } else if (isDual) {
            const book = ebooks.getDualLanguageBook(currentLang);
            mainContentHtml += `
                <div style="margin-bottom: 20px; text-align: center;">
                    <h2 style="color: #0f172a; margin-bottom: 4px;">${book.title}</h2>
                    <h3 style="color: #0f766e; margin-top: 0; font-size: 1.05rem;">${book.titleSpanish}</h3>
                    <p style="color: #64748b; font-size: 0.85rem; max-width: 650px; margin: 0 auto 20px;">${book.subtitle}</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    ${book.paragraphs.map(p => `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; page-break-inside: avoid;">
                            <div style="border-right: 1px solid #e2e8f0; padding-right: 12px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <div style="font-size: 0.75rem; color: #0284c7; font-weight: bold;">PÁRRAFO #${p.pNum} [ORIGINAL]</div>
                                    <button class="no-print btn-speaker" style="padding: 1px 6px; font-size: 0.72rem;" onclick="speakText('${encodeURIComponent(p.original)}')" title="Escuchar párrafo en inglés">🔊 Escuchar</button>
                                </div>
                                <div style="font-size: 0.92rem; color: #0f172a; line-height: 1.55;">${p.original}</div>
                            </div>
                            <div style="padding-left: 6px;">
                                <div style="font-size: 0.75rem; color: #0f766e; font-weight: bold; margin-bottom: 4px;">PÁRRAFO #${p.pNum} [TRADUCCIÓN ESPECULAR]</div>
                                <div style="font-size: 0.92rem; color: #334155; line-height: 1.55;">${p.spanish}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        printWin.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>${title} · Jetbulary Ebook Oficial</title>
                <style>
                    @page { size: A4 portrait; margin: 15mm 12mm; }
                    body {
                        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
                        color: #1e293b;
                        background: #f8fafc;
                        margin: 0;
                        padding: 20px;
                        line-height: 1.5;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print-bar {
                        position: sticky;
                        top: 10px;
                        z-index: 9999;
                        background: #0f172a;
                        color: #fff;
                        padding: 12px 20px;
                        border-radius: 10px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 25px;
                    }
                    .btn-print {
                        background: linear-gradient(135deg, #00f3ff, #00ff95);
                        color: #0f172a;
                        font-weight: 800;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        font-size: 0.95rem;
                        cursor: pointer;
                        box-shadow: 0 2px 10px rgba(0,243,255,0.4);
                    }
                    .book-cover {
                        background: linear-gradient(135deg, #0a0f1c, #1e293b);
                        color: #fff;
                        padding: 40px 30px;
                        border-radius: 12px;
                        border: 2px solid #00f3ff;
                        text-align: center;
                        margin-bottom: 30px;
                        page-break-after: always;
                    }
                    .cover-logo { font-size: 1.8rem; font-weight: 900; letter-spacing: 2px; color: #00f3ff; }
                    .cover-title { font-size: 1.7rem; font-weight: 900; margin: 20px 0 10px; line-height: 1.3; }
                    .cover-sub { color: #94a3b8; font-size: 1rem; max-width: 650px; margin: 0 auto 25px; }
                    .cover-box {
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(0,243,255,0.3);
                        border-radius: 8px;
                        padding: 18px 24px;
                        text-align: left;
                        max-width: 600px;
                        margin: 0 auto;
                        font-size: 0.88rem;
                        color: #cbd5e1;
                    }
                    .category-header {
                        background: #0f172a;
                        color: #00f3ff;
                        padding: 10px 16px;
                        border-radius: 6px;
                        font-weight: 800;
                        font-size: 0.95rem;
                        margin: 24px 0 12px;
                        page-break-after: avoid;
                    }
                    .item-card {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-left: 4px solid #0f766e;
                        padding: 12px 16px;
                        margin-bottom: 10px;
                        border-radius: 6px;
                        page-break-inside: avoid;
                    }
                    .item-title { font-size: 0.98rem; color: #0f172a; display: flex; align-items: center; gap: 8px; }
                    .badge-num { background: #e2e8f0; color: #475569; padding: 2px 7px; border-radius: 4px; font-size: 0.76rem; font-weight: bold; }
                    .badge-particle { background: #ccfbf1; color: #0f766e; padding: 2px 8px; border-radius: 4px; font-size: 0.74rem; font-weight: 800; }
                    .item-ipa { font-size: 0.8rem; color: #64748b; margin-top: 2px; }
                    .item-spanish { font-size: 0.88rem; color: #0f766e; font-weight: 600; margin-top: 3px; }
                    .item-example { font-size: 0.84rem; color: #0284c7; font-style: italic; margin-top: 3px; }
                    .item-tip { font-size: 0.8rem; color: #475569; margin-top: 4px; background: #f8fafc; padding: 5px 8px; border-radius: 4px; }
                    .btn-speaker {
                        background: #e0f2fe;
                        border: 1px solid #0284c7;
                        color: #0369a1;
                        border-radius: 6px;
                        padding: 3px 8px;
                        font-size: 0.8rem;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.2s;
                    }
                    .btn-speaker:hover {
                        background: #bae6fd;
                    }
                    @media print {
                        .no-print, .no-print-bar { display: none !important; }
                        body { background: #fff; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print-bar">
                    <div>
                        <strong style="color: #00f3ff;">JETBULARY EBOOK VIEWER</strong> · ${title}
                        <div style="font-size: 0.8rem; color: #94a3b8;">Pulsa 🔊 para escuchar la pronunciación nativa de la profesora o imprime/guarda en PDF</div>
                    </div>
                    <button onclick="window.print()" class="btn-print">🖨️ Guardar como PDF / Imprimir</button>
                </div>

                <div class="book-cover">
                    <div class="cover-logo">JETBULARY</div>
                    <div style="font-size: 0.8rem; letter-spacing: 1px; color: #94a3b8;">ACADEMIA DE IDIOMAS IA</div>
                    <div class="cover-title">${title}</div>
                    <div class="cover-sub">${subtitle}</div>
                    <div class="cover-box">
                        <strong>📖 GUÍA EXCLUSIVA DE APRENDIZAJE JETBULARY</strong><br>
                        Diseñado con rigor pedagógico para estudiantes hispanohablantes.<br>
                        Maquetación editorial cuidada para lectura en pantalla e impresión.
                    </div>
                </div>

                <div style="max-width: 850px; margin: 0 auto;">
                    ${mainContentHtml}
                </div>

                <div style="text-align: center; font-size: 0.8rem; color: #94a3b8; margin: 40px 0 20px; page-break-before: always;">
                    <strong>Jetbulary</strong> · Academia de Idiomas con IA · www.jetbulary.com<br>
                    Documento de libre consulta para alumnos registrados. Todos los derechos reservados.
                </div>

                <script>
                    function speakText(encoded) {
                        try {
                            const txt = decodeURIComponent(encoded);
                            if (!window.speechSynthesis) return;
                            window.speechSynthesis.cancel();
                            const u = new SpeechSynthesisUtterance(txt);
                            u.lang = '${(typeof LANGUAGES !== "undefined" && LANGUAGES[currentLang]?.speechLang) || "en-US"}';
                            u.rate = 0.88;
                            window.speechSynthesis.speak(u);
                        } catch(e) { console.error(e); }
                    }
                </script>
            </body>
            </html>
        `);
        printWin.document.close();
    },

    // ====== LECTOR INTERACTIVO EN LA APP (CON AUDIO DE LA PROFESORA) ======
    activeReaderType: 'business',
    isReaderSpeaking: false,
    continuousQueue: [],
    continuousIdx: 0,
    continuousTimer: null,

    openReader: function(type, autoPlay = false) {
        ebooks.activeReaderType = type || 'business';
        const modal = document.getElementById('modal-ebook-reader');
        const body = document.getElementById('ebook-reader-body');
        const titleEl = document.getElementById('ebook-reader-title');
        const subtitleEl = document.getElementById('ebook-reader-subtitle');
        const iconEl = document.getElementById('ebook-reader-icon');
        const teacherEl = document.getElementById('ebook-reader-teacher');

        if (!modal || !body) return;

        const teacherName = (typeof LANGUAGES !== 'undefined' && LANGUAGES[currentLang]?.teacherName) || 'Profesora IA';
        const langName = (typeof LANGUAGES !== 'undefined' && LANGUAGES[currentLang]?.name) || 'Idioma';
        if (teacherEl) teacherEl.innerText = `👩‍🏫 ${teacherName} (${langName})`;

        let isBusiness = (ebooks.activeReaderType === 'business' || ebooks.activeReaderType === 'negocios');
        let isPhrasal = (ebooks.activeReaderType === 'phrasal_verbs' || ebooks.activeReaderType === 'phrasal');
        let isStories = (ebooks.activeReaderType === 'short_stories' || ebooks.activeReaderType === 'historias');
        let isDual = (ebooks.activeReaderType === 'dual_language' || ebooks.activeReaderType === 'paralelo');

        let title = "LECTOR DE EBOOK";
        let subtitle = "Lectura interactiva con audio nativo de la profesora";
        let icon = "📖";

        if (isBusiness) {
            title = "LAS 100 FRASES MÁS USADAS EN NEGOCIOS";
            subtitle = `Manual Ejecutivo · Toca 🔊 en cualquier frase para escuchar la voz nativa de ${teacherName}`;
            icon = "📘";
        } else if (isPhrasal) {
            title = "GUÍA DEFINITIVA DE PHRASAL VERBS";
            subtitle = `100 Phrasal Verbs con Nemotecnia · Toca 🔊 para escuchar el verbo o la frase con ${teacherName}`;
            icon = "📗";
        } else if (isStories) {
            title = "HISTORIAS CORTAS PARA PRINCIPIANTES (A1-A2)";
            subtitle = `Relatos Graduados con Glosario y Preguntas · Audio de ${teacherName} en cada sección`;
            icon = "📙";
        } else if (isDual) {
            title = "TEXTO PARALELO: EL VIAJE DE DOS AMIGOS";
            subtitle = `Lectura Bilingüe Especular en 2 Columnas · Escucha los párrafos originales con ${teacherName}`;
            icon = "📕";
        }

        if (titleEl) titleEl.innerText = title;
        if (subtitleEl) subtitleEl.innerText = subtitle;
        if (iconEl) iconEl.innerText = icon;

        let contentHtml = '';

        if (isBusiness) {
            let currentCat = '';
            ebooks.businessPhrases.forEach(item => {
                if (item.category !== currentCat) {
                    currentCat = item.category;
                    contentHtml += `
                        <div style="background: rgba(0,243,255,0.12); border-left: 4px solid var(--neon-cyan); padding: 8px 12px; border-radius: 4px; font-family: 'Orbitron', sans-serif; font-size: 0.82rem; font-weight: bold; color: var(--neon-cyan); margin-top: 10px;">
                            📂 ${currentCat.toUpperCase()}
                        </div>
                    `;
                }
                contentHtml += `
                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                            <div style="font-size: 0.92rem; color: #FFF; font-weight: 700;">
                                <span style="background: rgba(0,243,255,0.2); color: var(--neon-cyan); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-right: 6px;">#${item.num}</span>
                                ${item.phrase}
                            </div>
                            <button onclick="ebooks.speakItem(decodeURIComponent('${encodeURIComponent(item.phrase)}'))" class="tech" style="padding: 4px 10px; border-radius: 6px; border: 1px solid var(--neon-cyan); background: rgba(0,243,255,0.2); color: #FFF; font-size: 0.82rem; cursor: pointer;" title="Escuchar pronunciación">🔊 Escuchar</button>
                        </div>
                        <div style="font-size: 0.76rem; color: #94a3b8; margin: 3px 0 4px;">IPA: ${item.ipa}</div>
                        <div style="font-size: 0.84rem; color: var(--cyber-ok); font-weight: 600;">🇪🇸 "${item.spanish}"</div>
                        <div style="font-size: 0.78rem; color: #cbd5e1; margin-top: 4px; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; border-left: 2px solid var(--neon-cyan);">
                            💡 <strong>Tip Ejecutivo:</strong> ${item.tip}
                        </div>
                    </div>
                `;
            });
        } else if (isPhrasal) {
            let currentCat = '';
            ebooks.phrasalVerbs.forEach(item => {
                if (item.particle !== currentCat) {
                    currentCat = item.particle;
                    contentHtml += `
                        <div style="background: rgba(0,255,149,0.12); border-left: 4px solid var(--cyber-ok); padding: 8px 12px; border-radius: 4px; font-family: 'Orbitron', sans-serif; font-size: 0.82rem; font-weight: bold; color: var(--cyber-ok); margin-top: 10px;">
                            ⚡ FAMILIA DE PARTÍCULA: "${currentCat.toUpperCase()}"
                        </div>
                    `;
                }
                contentHtml += `
                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                            <div style="font-size: 0.95rem; color: #FFF; font-weight: bold;">
                                <span style="background: rgba(0,255,149,0.2); color: var(--cyber-ok); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-right: 6px;">#${item.num}</span>
                                ${item.verb}
                                <button onclick="ebooks.speakItem(decodeURIComponent('${encodeURIComponent(item.verb)}'))" class="tech" style="padding: 2px 7px; border-radius: 4px; border: 1px solid var(--cyber-ok); background: rgba(0,255,149,0.15); color: #FFF; font-size: 0.72rem; cursor: pointer; margin-left: 6px;" title="Pronunciar verbo">🔊 Verbo</button>
                                <span style="background: rgba(255,255,255,0.1); color: #A5F3FC; font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">${item.particle}</span>
                            </div>
                            <button onclick="ebooks.speakItem(decodeURIComponent('${encodeURIComponent(item.example)}'))" class="tech" style="padding: 4px 10px; border-radius: 6px; border: 1px solid var(--neon-cyan); background: rgba(0,243,255,0.2); color: #FFF; font-size: 0.8rem; cursor: pointer;" title="Escuchar frase completa">🔊 Frase</button>
                        </div>
                        <div style="font-size: 0.84rem; color: var(--cyber-ok); font-weight: 600; margin: 4px 0 2px;">🎯 ${item.meaning}</div>
                        <div style="font-size: 0.82rem; color: #38bdf8; font-style: italic; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; margin: 4px 0;">
                            💬 "${item.example}"
                        </div>
                        <div style="font-size: 0.78rem; color: #cbd5e1; margin-top: 4px;">
                            ⚡ <strong>Truco Nemotécnico:</strong> ${item.tip}
                        </div>
                    </div>
                `;
            });
        } else if (isStories) {
            const stories = ebooks.getShortStories(currentLang);
            stories.forEach(st => {
                contentHtml += `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(0,243,255,0.25); border-radius: 12px; padding: 16px; margin-bottom: 14px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                            <div>
                                <h3 style="font-family: 'Orbitron', sans-serif; font-size: 0.96rem; color: var(--neon-cyan); margin: 0;">📖 ${st.title}</h3>
                                <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">${st.subtitle}</div>
                            </div>
                            <button onclick="ebooks.speakItem(decodeURIComponent('${encodeURIComponent(st.text)}'))" class="tech" style="padding: 5px 12px; border-radius: 8px; border: 1.5px solid var(--neon-cyan); background: rgba(0,243,255,0.2); color: #FFF; font-size: 0.8rem; font-weight: bold; cursor: pointer;" title="Escuchar capítulo completo">🔊 Escuchar Capítulo</button>
                        </div>

                        <div style="font-size: 0.88rem; color: #E2E8F0; line-height: 1.6; margin-top: 14px; background: rgba(0,0,0,0.4); padding: 14px; border-radius: 8px; border-left: 3px solid var(--neon-cyan); white-space: pre-line;">
                            ${st.text}
                        </div>

                        <div style="margin-top: 14px; background: rgba(0,255,149,0.06); border: 1px solid rgba(0,255,149,0.2); border-radius: 8px; padding: 12px;">
                            <strong style="color: var(--cyber-ok); font-size: 0.84rem;">📚 GLOSARIO DE TÉRMINOS CLAVE:</strong>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-top: 8px;">
                                ${st.glossary.map(g => `
                                    <div style="background: rgba(0,0,0,0.4); padding: 8px; border-radius: 6px; border-left: 2px solid var(--cyber-ok); font-size: 0.78rem;">
                                        <div style="display: flex; align-items: center; justify-content: space-between;">
                                            <strong style="color: #FFF;">${g.word}</strong>
                                            <button onclick="ebooks.speakItem(decodeURIComponent('${encodeURIComponent(g.word)}'))" style="border: none; background: transparent; color: var(--cyber-ok); cursor: pointer; padding: 0;" title="Escuchar palabra">🔊</button>
                                        </div>
                                        <div style="color: #94a3b8; font-size: 0.72rem;">[${g.ipa}]</div>
                                        <div style="color: var(--cyber-ok); font-weight: 600;">${g.spanish}</div>
                                        <div style="color: #cbd5e1; font-size: 0.7rem; margin-top: 2px;">${g.note}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div style="margin-top: 14px; background: rgba(255,0,85,0.06); border: 1px solid rgba(255,0,85,0.2); border-radius: 8px; padding: 12px;">
                            <strong style="color: var(--neon-pink); font-size: 0.84rem;">❓ PREGUNTAS DE COMPRENSIÓN:</strong>
                            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                                ${st.questions.map((q, qIdx) => `
                                    <div style="background: rgba(0,0,0,0.35); padding: 8px 10px; border-radius: 6px; font-size: 0.8rem;">
                                        <div style="display: flex; align-items: center; justify-content: space-between;">
                                            <div style="color: #FFF; font-weight: bold;">${qIdx + 1}. ${q.q}</div>
                                            <button onclick="ebooks.speakItem(decodeURIComponent('${encodeURIComponent(q.q)}'))" style="border: none; background: transparent; color: var(--neon-pink); cursor: pointer; padding: 0 4px; font-size: 0.85rem;" title="Escuchar pregunta">🔊</button>
                                        </div>
                                        <div style="color: #94a3b8; margin: 4px 0;">${q.options.map(o => `<div>${o}</div>`).join('')}</div>
                                        <div style="color: #5eead4; font-size: 0.75rem; font-style: italic; background: rgba(0,255,149,0.1); padding: 3px 6px; border-radius: 4px;">
                                            ✓ ${q.explanation}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            });
        } else if (isDual) {
            const book = ebooks.getDualLanguageBook(currentLang);
            contentHtml += `
                <div style="text-align: center; margin-bottom: 12px;">
                    <h3 style="color: var(--neon-cyan); margin: 0; font-family: 'Orbitron', sans-serif; font-size: 1rem;">${book.title}</h3>
                    <div style="color: var(--cyber-ok); font-size: 0.85rem; margin-top: 2px;">${book.titleSpanish}</div>
                    <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 4px;">${book.subtitle}</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${book.paragraphs.map(p => `
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px;">
                            <div style="border-right: 1px solid rgba(255,255,255,0.1); padding-right: 10px;">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                                    <span style="font-size: 0.72rem; color: var(--neon-cyan); font-weight: bold;">PÁRRAFO #${p.pNum} [ORIGINAL]</span>
                                    <button onclick="ebooks.speakItem(decodeURIComponent('${encodeURIComponent(p.original)}'))" class="tech" style="padding: 2px 7px; border-radius: 4px; border: 1px solid var(--neon-cyan); background: rgba(0,243,255,0.2); color: #FFF; font-size: 0.75rem; cursor: pointer;" title="Escuchar párrafo en inglés">🔊 Escuchar</button>
                                </div>
                                <div style="font-size: 0.85rem; color: #FFF; line-height: 1.5;">${p.original}</div>
                            </div>
                            <div style="padding-left: 4px;">
                                <div style="font-size: 0.72rem; color: var(--cyber-ok); font-weight: bold; margin-bottom: 4px;">PÁRRAFO #${p.pNum} [ESPAÑOL]</div>
                                <div style="font-size: 0.85rem; color: #cbd5e1; line-height: 1.5;">${p.spanish}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        body.innerHTML = contentHtml;
        modal.classList.remove('hidden');
        history.pushState({ modal: 'ebook-reader' }, null, '#ebook-reader');

        if (autoPlay) {
            setTimeout(() => {
                ebooks.toggleContinuousAudio();
            }, 350);
        }
    },

    closeReader: function(skipHistoryBack = false) {
        const modal = document.getElementById('modal-ebook-reader');
        if (modal) modal.classList.add('hidden');
        if (typeof audio !== 'undefined' && audio.stopSpeech) {
            audio.stopSpeech();
        } else if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        ebooks.isReaderSpeaking = false;
        ebooks.updateContinuousAudioBtn();
        if (!skipHistoryBack && history.state && history.state.modal === 'ebook-reader') {
            history.back();
        }
    },

    speakItem: function(text) {
        if (!text) return;
        if (ebooks.isReaderSpeaking) {
            ebooks.stopContinuousAudio();
        }
        if (typeof audio !== 'undefined' && audio.speakNative) {
            audio.speakNative(text, currentLang);
        } else if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = LANGUAGES[currentLang]?.speechLang || 'en-US';
            window.speechSynthesis.speak(u);
        }
    },

    toggleContinuousAudio: function() {
        if (ebooks.isReaderSpeaking) {
            ebooks.stopContinuousAudio();
            return;
        }

        let phrasesToRead = [];
        const isBusiness = (ebooks.activeReaderType === 'business' || ebooks.activeReaderType === 'negocios');
        const isPhrasal = (ebooks.activeReaderType === 'phrasal_verbs' || ebooks.activeReaderType === 'phrasal');
        const isStories = (ebooks.activeReaderType === 'short_stories' || ebooks.activeReaderType === 'historias');
        const isDual = (ebooks.activeReaderType === 'dual_language' || ebooks.activeReaderType === 'paralelo');

        if (isBusiness) {
            phrasesToRead = ebooks.businessPhrases.slice(0, 20).map(p => p.phrase);
        } else if (isPhrasal) {
            phrasesToRead = ebooks.phrasalVerbs.slice(0, 20).map(p => p.example);
        } else if (isStories) {
            const stories = ebooks.getShortStories(currentLang);
            phrasesToRead = [stories[0].text];
        } else if (isDual) {
            const book = ebooks.getDualLanguageBook(currentLang);
            phrasesToRead = book.paragraphs.map(p => p.original);
        }

        if (phrasesToRead.length === 0) return;

        ebooks.isReaderSpeaking = true;
        ebooks.continuousQueue = phrasesToRead;
        ebooks.continuousIdx = 0;
        ebooks.updateContinuousAudioBtn();

        const readNext = () => {
            if (!ebooks.isReaderSpeaking) return;
            if (ebooks.continuousIdx >= ebooks.continuousQueue.length) {
                ebooks.stopContinuousAudio();
                return;
            }
            const currentItem = ebooks.continuousQueue[ebooks.continuousIdx];
            ebooks.continuousIdx++;

            if (typeof audio !== 'undefined' && audio.speakNative) {
                audio.speakNative(currentItem, currentLang, () => {
                    if (ebooks.isReaderSpeaking) {
                        ebooks.continuousTimer = setTimeout(readNext, 800);
                    }
                });
            } else if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const u = new SpeechSynthesisUtterance(currentItem);
                u.lang = LANGUAGES[currentLang]?.speechLang || 'en-US';
                u.onend = () => {
                    if (ebooks.isReaderSpeaking) {
                        ebooks.continuousTimer = setTimeout(readNext, 800);
                    }
                };
                window.speechSynthesis.speak(u);
            }
        };

        readNext();
    },

    stopContinuousAudio: function() {
        ebooks.isReaderSpeaking = false;
        if (ebooks.continuousTimer) {
            clearTimeout(ebooks.continuousTimer);
            ebooks.continuousTimer = null;
        }
        if (typeof audio !== 'undefined' && audio.stopSpeech) {
            audio.stopSpeech();
        } else if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        ebooks.updateContinuousAudioBtn();
    },

    updateContinuousAudioBtn: function() {
        const lbl = document.getElementById('lbl-reader-listen-all');
        if (!lbl) return;
        if (ebooks.isReaderSpeaking) {
            lbl.innerText = "⏹️ Detener Lectura";
        } else {
            lbl.innerText = "Escuchar con Profesora";
        }
    }

};

if (typeof window !== 'undefined') {
    window.ebooks = ebooks;
}

console.log("Ebooks module loaded successfully. 4 categories ready.");
