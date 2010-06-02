import rdflib

from pmr2.rdf.base import RdfXmlMetadata

namespaces = {
    'dc': 'http://purl.org/dc/elements/1.1/',
    'dcterms': 'http://purl.org/dc/terms/',
    'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'vCard': 'http://www.w3.org/2001/vcard-rdf/3.0#',
    'pmr2': 'http://namespace.physiomeproject.org/pmr2#',
    'pmr2note': 'http://namespace.physiomeproject.org/pmr2/note#',
}


class RdfExposureNoteHelper(RdfXmlMetadata):

    def querySingleDC(self, subject):
        """\
        We allow multiple creators in this one.
        """

        if isinstance(subject, basestring):
            subject = rdflib.URIRef(subject)

        bindings = {
            rdflib.Variable('?type'): rdflib.URIRef(subject),
        }
        q = """\
        SELECT ?title ?creator ?description WHERE {
            ?subject dc:title ?title .
            OPTIONAL { ?subject dc:creator ?creator . }
            OPTIONAL { ?subject dc:description ?description . }
        }
        """

        result = self.query(q, bindings, self.namespaces).selected
        if result:
            # We only care about the first one.
            result = list(result[0])

        if not isinstance(result[1], rdflib.Literal):
            # further query
            bindings = {
                rdflib.Variable('?node'): result[1],
            }
            q = """\
            SELECT ?value WHERE {
                ?node ?li ?value .
            }
            ORDER BY ?li
            """
            creators = self.query(q, bindings, self.namespaces).selected
            result[1] = ', '.join(
                [i.strip() for i in creators if isinstance(i, rdflib.Literal)])

        keys = ('dc:title', 'dc:creator', 'dc:description')
        return tuple(zip(keys, [j and j.strip() for j in result]))
